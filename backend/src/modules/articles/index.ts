import { Elysia, t } from "elysia"
import { authGuard } from "../auth-guard"
import { db } from "../../db/client"
import { ok, fail, okPaginated } from "../../lib/response"
import { sendArticleReviewEmail } from "../../email"
import * as articleService from "./service"

const AUTO_PUBLISH_SCORE = 85

export const articlesRouter = new Elysia()
  .use(authGuard)

  // GET /api/orgs/:slug/articles — daftar artikel
  .get("/api/orgs/:slug/articles", async ({ organization, query, user }) => {
    const { status, categoryId, search, page: pg = "1", pageSize: ps = "20" } = query
    const page = Number(pg), pageSize = Number(ps)

    // Cek role: contributor hanya melihat artikelnya sendiri
    let authorId = query.authorId
    if (!authorId) {
      const member = await db.member.findFirst({
        where: { organizationId: organization.id, userId: user.id },
      })
      if (member) {
        const role = member.role.toLowerCase()
        if (role === "contributor" || role === "member") {
          authorId = user.id
        }
      }
    }

    const { rows, total } = await articleService.findMany(organization.id, {
      status, categoryId, authorId, search, page, pageSize,
    })
    return okPaginated(rows, total, page, pageSize)
  }, {
    authOrg: true,
    query: t.Object({
      status: t.Optional(t.String()),
      categoryId: t.Optional(t.String()),
      authorId: t.Optional(t.String()),
      search: t.Optional(t.String()),
      page: t.Optional(t.String()),
      pageSize: t.Optional(t.String()),
    }),
  })

  // GET /api/orgs/:slug/articles/:id — detail artikel
  .get("/api/orgs/:slug/articles/:id", async ({ organization, params }) => {
    const article = await articleService.findById(params.id)
    if (!article || article.workspaceId !== organization.id) return fail("Artikel tidak ditemukan")
    return ok(article)
  }, { authOrg: true, params: t.Object({ slug: t.String(), id: t.String() }) })

  // POST /api/orgs/:slug/articles — buat artikel baru
  .post("/api/orgs/:slug/articles", async ({ organization, body, user }) => {
    const article = await articleService.create({
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      content: body.content,
      categoryId: body.categoryId,
      authorId: user.id,
      workspaceId: organization.id,
    })
    await articleService.createEvent({
      articleId: article.id,
      userId: user.id,
      eventType: "CREATED",
      metadata: JSON.stringify({ title: body.title }),
    })
    return ok(article)
  }, {
    authOrg: true,
    body: t.Object({
      title: t.String(),
      slug: t.String(),
      excerpt: t.Optional(t.String()),
      content: t.Optional(t.String()),
      categoryId: t.Optional(t.String()),
    }),
  })

  // PUT /api/orgs/:slug/articles/:id — update artikel
  .put("/api/orgs/:slug/articles/:id", async ({ organization, params, body, user }) => {
    const existing = await articleService.findById(params.id)
    if (!existing || existing.workspaceId !== organization.id) return fail("Artikel tidak ditemukan")

    // Cegah edit jika sudah PUBLISHED atau ARCHIVED
    if (existing.status === "PUBLISHED" || existing.status === "ARCHIVED") {
      return fail("Artikel yang sudah terbit atau diarsipkan tidak dapat diubah")
    }

    const article = await articleService.update(params.id, body)
    await articleService.createEvent({
      articleId: article.id,
      userId: user.id,
      eventType: "UPDATED",
      metadata: JSON.stringify({ changes: Object.keys(body) }),
    })
    return ok(article)
  }, {
    authOrg: true,
    params: t.Object({ slug: t.String(), id: t.String() }),
    body: t.Object({
      title: t.Optional(t.String()),
      slug: t.Optional(t.String()),
      excerpt: t.Optional(t.String()),
      content: t.Optional(t.String()),
      categoryId: t.Optional(t.Nullable(t.String())),
      status: t.Optional(t.String()),
      reviewerId: t.Optional(t.Nullable(t.String())),
      honor: t.Optional(t.Number()),
      coverImageUrl: t.Optional(t.Nullable(t.String())),
    }),
  })

  // DELETE /api/orgs/:slug/articles/:id — hapus artikel
  .delete("/api/orgs/:slug/articles/:id", async ({ organization, params, user }) => {
    const existing = await articleService.findById(params.id)
    if (!existing || existing.workspaceId !== organization.id) return fail("Artikel tidak ditemukan")
    if (existing.status === "PUBLISHED") return fail("Artikel yang sudah terbit tidak dapat dihapus. Arsipkan terlebih dahulu.")
    await articleService.remove(params.id)
    await articleService.createEvent({
      articleId: params.id,
      userId: user.id,
      eventType: "DELETED",
    })
    return ok({ deleted: true })
  }, { authOrg: true, params: t.Object({ slug: t.String(), id: t.String() }) })

  // POST /api/orgs/:slug/articles/:id/submit — submit untuk review
  .post("/api/orgs/:slug/articles/:id/submit", async ({ organization, params, body, user }) => {
    const existing = await articleService.findById(params.id)
    if (!existing || existing.workspaceId !== organization.id) return fail("Artikel tidak ditemukan")
    if (existing.status !== "DRAFT" && existing.status !== "REVISION_REQUESTED") {
      return fail("Hanya artikel dengan status DRAFT atau REVISION_REQUESTED yang bisa disubmit")
    }

    // Jika reviewerId tidak dikirim, cari owner organisasi sebagai default
    let reviewerId = body.reviewerId
    if (!reviewerId) {
      const ownerMember = await db.member.findFirst({
        where: { organizationId: organization.id, role: "owner" },
      })
      reviewerId = ownerMember?.userId
    }

    if (!reviewerId) {
      return fail("Tidak ada reviewer yang tersedia")
    }

    const article = await articleService.submitForReview(params.id, reviewerId)
    await articleService.createEvent({
      articleId: article.id,
      userId: user.id,
      eventType: "SUBMITTED",
      metadata: JSON.stringify({ reviewerId }),
    })
    return ok(article)
  }, {
    authOrg: true,
    params: t.Object({ slug: t.String(), id: t.String() }),
    body: t.Object({ reviewerId: t.Optional(t.String()) }),
  })

  // POST /api/orgs/:slug/articles/:id/review — review artikel
  .post("/api/orgs/:slug/articles/:id/review", async ({ organization, params, body, user }) => {
    const existing = await articleService.findById(params.id)
    if (!existing || existing.workspaceId !== organization.id) return fail("Artikel tidak ditemukan")
    if (existing.status !== "PENDING_REVIEW") return fail("Hanya artikel dengan status PENDING_REVIEW yang bisa direview")

    const article = await articleService.reviewArticle(params.id, {
      decision: body.decision,
      score: body.score,
      notes: body.notes,
      reviewerId: user.id,
      autoPublishScore: AUTO_PUBLISH_SCORE,
    })

    const eventType = body.decision === "APPROVED"
      ? "APPROVED"
      : body.decision === "REJECTED"
        ? "REJECTED"
        : "REVISION_REQUESTED"
    await articleService.createEvent({
      articleId: article.id,
      userId: user.id,
      eventType,
      metadata: JSON.stringify({ score: body.score, notes: body.notes }),
    })

    // Kirim email notifikasi ke penulis
    const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000"
    const articleUrl = `${FRONTEND_URL}/orgs/${organization.slug}/articles/${article.id}/review`
    if (body.decision === "APPROVED" || body.decision === "REVISION_REQUESTED") {
      sendArticleReviewEmail(
        existing.author.email,
        existing.author.name,
        existing.title,
        body.decision,
        articleUrl,
        body.score,
        body.notes,
      ).catch((err) => console.warn("[review] Gagal kirim email:", err))
    }

    return ok(article)
  }, {
    authOrg: true,
    params: t.Object({ slug: t.String(), id: t.String() }),
    body: t.Object({
      decision: t.UnionEnum(["APPROVED", "REVISION_REQUESTED", "REJECTED"]),
      score: t.Optional(t.Number()),
      notes: t.Optional(t.String()),
    }),
  })

  // POST /api/orgs/:slug/articles/:id/publish — terbitkan artikel
  .post("/api/orgs/:slug/articles/:id/publish", async ({ organization, params, user }) => {
    const existing = await articleService.findById(params.id)
    if (!existing || existing.workspaceId !== organization.id) return fail("Artikel tidak ditemukan")
    if (existing.status !== "APPROVED") return fail("Hanya artikel dengan status APPROVED yang bisa diterbitkan")

    const article = await articleService.publishArticle(params.id)
    await articleService.createEvent({
      articleId: article.id,
      userId: user.id,
      eventType: "PUBLISHED",
      metadata: JSON.stringify({ autoPublish: false }),
    })
    return ok(article)
  }, { authOrg: true, params: t.Object({ slug: t.String(), id: t.String() }) })

  // POST /api/orgs/:slug/articles/:id/archive — arsipkan artikel
  .post("/api/orgs/:slug/articles/:id/archive", async ({ organization, params, user }) => {
    const existing = await articleService.findById(params.id)
    if (!existing || existing.workspaceId !== organization.id) return fail("Artikel tidak ditemukan")
    if (existing.status !== "PUBLISHED") return fail("Hanya artikel dengan status PUBLISHED yang bisa diarsipkan")

    const article = await articleService.archiveArticle(params.id)
    await articleService.createEvent({
      articleId: article.id,
      userId: user.id,
      eventType: "ARCHIVED",
    })
    return ok(article)
  }, { authOrg: true, params: t.Object({ slug: t.String(), id: t.String() }) })

  // GET /api/orgs/:slug/articles/:id/events — riwayat event artikel
  .get("/api/orgs/:slug/articles/:id/events", async ({ organization, params }) => {
    const existing = await articleService.findById(params.id)
    if (!existing || existing.workspaceId !== organization.id) return fail("Artikel tidak ditemukan")
    const events = await articleService.getEvents(params.id)
    return ok(events)
  }, { authOrg: true, params: t.Object({ slug: t.String(), id: t.String() }) })

import { Elysia, t } from "elysia"
import { authGuard } from "../auth-guard"
import { db } from "../../db/client"
import { ok, fail, okPaginated } from "../../lib/response"

const WP_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
  "#84cc16", "#e11d48", "#0ea5e9", "#a855f7", "#22c55e",
]

function randomColor() {
  return WP_COLORS[Math.floor(Math.random() * WP_COLORS.length)]
}

export const categoriesRouter = new Elysia()
  .use(authGuard)

  // GET /api/orgs/:slug/categories — daftar kategori
  .get("/api/orgs/:slug/categories", async ({ organization, query }) => {
    const { page: pg = "1", pageSize: ps = "50" } = query
    const page = Number(pg), pageSize = Number(ps)
    const where = { workspaceId: organization.id }
    const [rows, total] = await Promise.all([
      db.category.findMany({
        where: where as any,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.category.count({ where: where as any }),
    ])
    return okPaginated(rows, total, page, pageSize)
  }, {
    authOrg: true,
    query: t.Object({
      page: t.Optional(t.String()),
      pageSize: t.Optional(t.String()),
    }),
  })

  // GET /api/orgs/:slug/categories/:id — detail kategori
  .get("/api/orgs/:slug/categories/:id", async ({ organization, params }) => {
    const cat = await db.category.findFirst({
      where: { id: params.id, workspaceId: organization.id },
    })
    if (!cat) return fail("Kategori tidak ditemukan")
    return ok(cat)
  }, { authOrg: true, params: t.Object({ slug: t.String(), id: t.String() }) })

  // POST /api/orgs/:slug/categories — buat kategori baru
  .post("/api/orgs/:slug/categories", async ({ organization, body }) => {
    const existing = await db.category.findFirst({
      where: { slug: body.slug, workspaceId: organization.id },
    })
    if (existing) return fail("Slug kategori sudah digunakan")
    const cat = await db.category.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        color: body.color ?? randomColor(),
        workspaceId: organization.id,
      },
    })
    return ok(cat)
  }, {
    authOrg: true,
    body: t.Object({
      name: t.String(),
      slug: t.String(),
      description: t.Optional(t.String()),
      color: t.Optional(t.String()),
    }),
  })

  // PUT /api/orgs/:slug/categories/:id — update kategori
  .put("/api/orgs/:slug/categories/:id", async ({ organization, params, body }) => {
    const existing = await db.category.findFirst({
      where: { id: params.id, workspaceId: organization.id },
    })
    if (!existing) return fail("Kategori tidak ditemukan")
    const cat = await db.category.update({
      where: { id: params.id },
      data: body as any,
    })
    return ok(cat)
  }, {
    authOrg: true,
    params: t.Object({ slug: t.String(), id: t.String() }),
    body: t.Object({
      name: t.Optional(t.String()),
      slug: t.Optional(t.String()),
      description: t.Optional(t.String()),
      color: t.Optional(t.String()),
    }),
  })

  // DELETE /api/orgs/:slug/categories/:id — hapus kategori
  .delete("/api/orgs/:slug/categories/:id", async ({ organization, params }) => {
    const existing = await db.category.findFirst({
      where: { id: params.id, workspaceId: organization.id },
    })
    if (!existing) return fail("Kategori tidak ditemukan")

    // Cegah hapus jika masih ada artikel yang menggunakan kategori ini
    const articleCount = await db.article.count({
      where: { categoryId: params.id, workspaceId: organization.id } as any,
    })
    if (articleCount > 0) {
      return fail(`Kategori tidak dapat dihapus karena masih digunakan oleh ${articleCount} artikel. Pindahkan artikel ke kategori lain terlebih dahulu.`)
    }

    await db.category.delete({ where: { id: params.id } })
    return ok({ deleted: true })
  }, { authOrg: true, params: t.Object({ slug: t.String(), id: t.String() }) })

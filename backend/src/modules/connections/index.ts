import { Elysia, t } from "elysia"
import { authGuard } from "../auth-guard"
import { db } from "../../db/client"
import { ok, fail, okPaginated } from "../../lib/response"

const wpFetch = (baseUrl: string, username: string, appPassword: string, path: string, extra: RequestInit = {}) => {
  const credentials = Buffer.from(`${username}:${appPassword}`).toString("base64")
  return fetch(`${baseUrl.replace(/\/+$/, "")}/wp-json/wp/v2/${path}`, {
    ...extra,
    headers: { Authorization: `Basic ${credentials}`, ...(extra.headers as Record<string, string> || {}) },
  })
}

export const connectionsRouter = new Elysia()
  .use(authGuard)

  .post("/api/connections/wordpress/test", async ({ body }) => {
    const { siteUrl, username, appPassword } = body
    try {
      const response = await wpFetch(siteUrl, username, appPassword, "users/me")
      if (!response.ok) {
        if (response.status === 404) return { success: false, message: "Endpoint WordPress REST API tidak ditemukan." }
        if (response.status === 401 || response.status === 403) return { success: false, message: "Kredensial WordPress salah." }
        return { success: false, message: `WordPress merespon dengan status ${response.status}.` }
      }
      const data = await response.json() as { name?: string; slug?: string; avatar_urls?: Record<string, string> }
      return { success: true, message: "Koneksi ke WordPress berhasil!", data: { displayName: data.name ?? username, username: data.slug ?? username, avatar: data.avatar_urls?.["96"] ?? null } }
    } catch {
      return { success: false, message: "Tidak dapat terhubung ke WordPress." }
    }
  }, { auth: true, body: t.Object({ siteUrl: t.String(), username: t.String(), appPassword: t.String() }) })

  .get("/api/orgs/:slug/connections", async ({ organization, query }) => {
    const { type, page: pg = "1", pageSize: ps = "20" } = query
    const p = Number(pg), sp = Number(ps)
    const where: Record<string, unknown> = { workspaceId: organization.id }
    if (type) where.type = type
    const [rows, total] = await Promise.all([
      db.workspaceConnection.findMany({ where: where as any, skip: (p - 1) * sp, take: sp }),
      db.workspaceConnection.count({ where: where as any }),
    ])
    return okPaginated(rows, total, p, sp)
  }, { authOrg: true, query: t.Object({ type: t.Optional(t.String()), page: t.Optional(t.String()), pageSize: t.Optional(t.String()) }) })

  .post("/api/orgs/:slug/connections", async ({ organization, body }) => {
    const conn = await db.workspaceConnection.create({
      data: { workspaceId: organization.id, type: body.type, config: JSON.stringify(body.config), status: body.status ?? "disconnected" },
    })
    return ok(conn)
  }, { authOrg: true, body: t.Object({ type: t.String(), config: t.Any(), status: t.Optional(t.String()) }) })

  .put("/api/orgs/:slug/connections/:id", async ({ organization, params, body }) => {
    const conn = await db.workspaceConnection.findFirst({ where: { id: params.id, workspaceId: organization.id } })
    if (!conn) return fail("Koneksi tidak ditemukan")
    const updated = await db.workspaceConnection.update({
      where: { id: params.id },
      data: { config: body.config ? JSON.stringify(body.config) : conn.config, status: body.status ?? conn.status, lastSyncAt: body.status === "connected" ? new Date() : conn.lastSyncAt },
    })
    return ok(updated)
  }, { authOrg: true, params: t.Object({ slug: t.String(), id: t.String() }), body: t.Object({ config: t.Optional(t.Any()), status: t.Optional(t.String()) }) })

  .delete("/api/orgs/:slug/connections/:id", async ({ organization, params }) => {
    const conn = await db.workspaceConnection.findFirst({ where: { id: params.id, workspaceId: organization.id } })
    if (!conn) return fail("Koneksi tidak ditemukan")
    await db.workspaceConnection.delete({ where: { id: params.id } })
    return ok({ deleted: true })
  }, { authOrg: true, params: t.Object({ slug: t.String(), id: t.String() }) })

  .post("/api/orgs/:slug/connections/wordpress/import-categories", async ({ organization }) => {
    const conn = await getActiveWpConnection(organization.id)
    if (!conn) return fail("Tidak ada koneksi WordPress aktif")
    const config = parseWpConfig(conn.config)
    if (!config) return fail("Konfigurasi koneksi tidak valid")

    try {
      let page = 1, imported = 0
      const wpColors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#e11d48", "#0ea5e9", "#a855f7", "#22c55e"]
      while (true) {
        const response = await wpFetch(config.siteUrl, config.username, config.appPassword, `categories?per_page=100&page=${page}`)
        if (!response.ok) break
        const cats = await response.json() as { id: number; name: string; slug: string; description: string }[]
        if (cats.length === 0) break
        for (const wpCat of cats) {
          const existing = await db.category.findFirst({ where: { wpCategoryId: wpCat.id, workspaceId: organization.id } })
          if (!existing) {
            await db.category.create({
              data: { name: wpCat.name, slug: wpCat.slug, description: wpCat.description || null, color: wpColors[imported % wpColors.length], wpCategoryId: wpCat.id, workspaceId: organization.id },
            })
            imported++
          }
        }
        page++
      }
      await db.workspaceConnection.update({ where: { id: conn.id }, data: { lastSyncAt: new Date() } })
      return ok({ imported, message: `Berhasil mengimpor ${imported} kategori dari WordPress` })
    } catch { return fail("Gagal mengimpor kategori dari WordPress") }
  }, { authOrg: true })

  // POST /api/orgs/:slug/articles/:id/publish-wordpress — publikasi artikel ke WordPress
  .post("/api/orgs/:slug/articles/:id/publish-wordpress", async ({ organization, params }) => {
    const article = await db.article.findFirst({
      where: { id: params.id, workspaceId: organization.id },
      select: { id: true, title: true, content: true, excerpt: true, slug: true, status: true },
    })
    if (!article) return fail("Artikel tidak ditemukan")
    if (article.status !== "APPROVED" && article.status !== "PUBLISHED") {
      return fail("Hanya artikel dengan status APPROVED atau PUBLISHED yang bisa dipublikasikan ke WordPress")
    }

    const conn = await getActiveWpConnection(organization.id)
    if (!conn) return fail("Tidak ada koneksi WordPress aktif. Silakan atur koneksi terlebih dahulu.")
    const config = parseWpConfig(conn.config)
    if (!config) return fail("Konfigurasi koneksi tidak valid")

    // Cek apakah sudah pernah dipublikasikan (idempotent)
    const existingLog = await db.wpSyncLog.findFirst({
      where: { workspaceId: organization.id, action: "publish", payload: { contains: params.id } } as any,
      orderBy: { createdAt: "desc" },
    })
    if (existingLog) {
      try {
        const payload = JSON.parse(existingLog.payload || "{}")
        if (payload.externalPostId) {
          return ok({ alreadyPublished: true, externalPostId: payload.externalPostId, message: "Artikel sudah pernah dipublikasikan ke WordPress" })
        }
      } catch { /* parse error, proceed */ }
    }

    try {
      const body: Record<string, unknown> = {
        title: article.title,
        content: article.content || "",
        excerpt: article.excerpt || "",
        slug: article.slug,
        status: "publish",
      }

      const response = await wpFetch(config.siteUrl, config.username, config.appPassword, "posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errBody = await response.text().catch(() => "")
        await logWpSync(organization.id, "publish", "failed", { articleId: params.id, error: errBody, status: response.status })
        return fail(`Gagal mempublikasikan ke WordPress (HTTP ${response.status})`)
      }

      const wpPost = await response.json() as { id: number; link: string }

      await logWpSync(organization.id, "publish", "success", {
        articleId: params.id,
        externalPostId: wpPost.id,
        externalUrl: wpPost.link,
      })

      return ok({ externalPostId: wpPost.id, externalUrl: wpPost.link, message: "Artikel berhasil dipublikasikan ke WordPress!" })
    } catch (e: any) {
      await logWpSync(organization.id, "publish", "failed", { articleId: params.id, error: e.message })
      return fail("Gagal terhubung ke WordPress. Periksa koneksi Anda.")
    }
  }, { authOrg: true, params: t.Object({ slug: t.String(), id: t.String() }) })

  // POST /api/orgs/:slug/connections/:id/sync-users — sinkronisasi user WordPress
  .post("/api/orgs/:slug/connections/:id/sync-users", async ({ organization, params }) => {
    const conn = await db.workspaceConnection.findFirst({
      where: { id: params.id, workspaceId: organization.id, type: "wordpress", status: "connected" },
    })
    if (!conn) return fail("Koneksi WordPress tidak ditemukan atau tidak aktif")
    const config = parseWpConfig(conn.config)
    if (!config) return fail("Konfigurasi koneksi tidak valid")

    try {
      let page = 1, synced = 0
      while (true) {
        const response = await wpFetch(config.siteUrl, config.username, config.appPassword, `users?per_page=100&page=${page}`)
        if (!response.ok) break
        const users = await response.json() as { id: number; name: string; slug: string; email?: string; avatar_urls?: Record<string, string> }[]
        if (users.length === 0) break

        // ponytail: hanya log user WP, tidak import ke Better Auth (butuh mapping manual)
        for (const wpUser of users) {
          await db.wpSyncLog.create({
            data: {
              workspaceId: organization.id,
              action: "sync-user",
              status: "success",
              payload: JSON.stringify({
                wpUserId: wpUser.id,
                displayName: wpUser.name,
                username: wpUser.slug,
                email: wpUser.email || null,
              }),
            } as any,
          })
          synced++
        }
        page++
      }
      await db.workspaceConnection.update({ where: { id: conn.id }, data: { lastSyncAt: new Date() } })
      return ok({ synced, message: `Berhasil menyinkronkan ${synced} user dari WordPress` })
    } catch { return fail("Gagal menyinkronkan user WordPress") }
  }, { authOrg: true, params: t.Object({ slug: t.String(), id: t.String() }) })

// ─── Helper Functions ─────────────────────────────────

async function getActiveWpConnection(workspaceId: string) {
  return db.workspaceConnection.findFirst({
    where: { workspaceId, type: "wordpress", status: "connected" } as any,
  })
}

function parseWpConfig(config: string | null): { siteUrl: string; username: string; appPassword: string } | null {
  if (!config) return null
  try {
    const parsed = JSON.parse(config)
    if (parsed.siteUrl && parsed.username && parsed.appPassword) {
      return parsed as { siteUrl: string; username: string; appPassword: string }
    }
    return null
  } catch {
    return null
  }
}

async function logWpSync(workspaceId: string, action: string, status: string, payload: Record<string, unknown>) {
  await db.wpSyncLog.create({
    data: { workspaceId, action, status, payload: JSON.stringify(payload) } as any,
  })
}

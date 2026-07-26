import { Elysia, t } from "elysia"
import { auth } from "../../auth"
import { authGuard } from "../auth-guard"
import { db } from "../../db/client"
import { ok, fail } from "../../lib/response"

export const membersRouter = new Elysia()
  .use(authGuard)

  // GET /api/orgs/:slug/join-status — cek apakah publik join aktif
  .get("/api/orgs/:slug/join-status", async ({ params }) => {
    const org = await db.organization.findUnique({
      where: { slug: params.slug },
    })
    if (!org) return ok({ publicJoinEnabled: false, exists: false })

    const prefs = await db.workspacePreference.findUnique({
      where: { workspaceId: org.id } as any,
    })
    const publicJoinEnabled = prefs ? (prefs.publicJoinEnabled ?? true) : true

    return ok({ publicJoinEnabled, exists: true })
  }, {
    params: t.Object({ slug: t.String() }),
  })

  // GET /api/orgs/:slug/members — daftar anggota org
  .get("/api/orgs/:slug/members", async ({ organization, request: { headers } }) => {
    const result = await (auth.api as any).listMembers({
      headers: Object.fromEntries(headers),
      query: { organizationId: organization.id },
    })
    return ok(result?.members ?? [])
  }, { authOrg: true })

  // POST /api/orgs/:slug/members/invite — undang anggota baru via email
  .post("/api/orgs/:slug/members/invite", async ({ organization, body, request: { headers } }) => {
    const result = await (auth.api as any).inviteMember({
      headers: Object.fromEntries(headers),
      body: {
        organizationId: organization.id,
        email: body.email,
        role: body.role,
      },
    })
    if (!result) return fail("Gagal mengundang anggota")
    return ok(result)
  }, {
    authOrg: true,
    body: t.Object({
      email: t.String({ format: "email" }),
      role: t.String(),
    }),
  })

  // DELETE /api/orgs/:slug/members/:memberId — hapus anggota
  .delete("/api/orgs/:slug/members/:memberId", async ({ organization, params, request: { headers } }) => {
    const result = await (auth.api as any).removeMember({
      headers: Object.fromEntries(headers),
      body: {
        organizationId: organization.id,
        memberIdOrEmail: params.memberId,
      },
    })
    return ok({ removed: true })
  }, { authOrg: true, params: t.Object({ slug: t.String(), memberId: t.String() }) })

  // PUT /api/orgs/:slug/members/:memberId/role — update role anggota
  .put("/api/orgs/:slug/members/:memberId/role", async ({ organization, params, body, request: { headers } }) => {
    const result = await (auth.api as any).updateMemberRole({
      headers: Object.fromEntries(headers),
      body: {
        organizationId: organization.id,
        memberId: params.memberId,
        role: body.role,
      },
    })
    return ok(result)
  }, {
    authOrg: true,
    params: t.Object({ slug: t.String(), memberId: t.String() }),
    body: t.Object({ role: t.String() }),
  })

  // POST /api/orgs/:slug/join — bergabung ke workspace publik
  .post("/api/orgs/:slug/join", async ({ user, params }) => {
    const org = await db.organization.findUnique({
      where: { slug: params.slug },
    })
    if (!org) return fail("Ruang kerja tidak ditemukan")

    // Cek apakah ruang kerja mengizinkan bergabung publik
    const prefs = await db.workspacePreference.findUnique({
      where: { workspaceId: org.id } as any,
    })
    if (prefs && !prefs.publicJoinEnabled) {
      return fail("Ruang kerja ini tidak menerima anggota baru melalui tautan publik")
    }

    // Cek apakah user sudah menjadi anggota
    const existingMember = await db.member.findFirst({
      where: { organizationId: org.id, userId: user.id },
    })
    if (existingMember) {
      return ok({ message: "Anda sudah menjadi anggota" })
    }

    // Tambahkan sebagai member dengan role Kontributor ("member")
    // langsung via DB — addMember Better Auth butuh permission admin/owner
    try {
      const member = await db.member.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: org.id,
          userId: user.id,
          role: "contributor",
          createdAt: new Date(),
        },
      })
      return ok(member)
    } catch (err) {
      console.error("[join] Gagal create member:", err)
      return fail("Gagal bergabung ke ruang kerja")
    }
  }, {
    auth: true,
    params: t.Object({ slug: t.String() }),
  })

import { Elysia, t } from "elysia"
import { auth } from "../../auth"
import { authGuard } from "../auth-guard"
import { db } from "../../db/client"
import { ok, fail } from "../../lib/response"

export const settingsRouter = new Elysia()
  .use(authGuard)

  // GET /api/orgs/:slug/settings — all settings for workspace
  .get("/api/orgs/:slug/settings", async ({ organization }) => {
    const prefs = await db.workspacePreference.findUnique({
      where: { workspaceId: organization.id } as any,
    })

    let defaultHonor = 100000
    let minPayout = 50000
    let defaultScoreForPublish: number | null = null
    let publicJoinEnabled = true

    if (prefs) {
      defaultHonor = prefs.defaultHonor
      minPayout = prefs.minPayout
      defaultScoreForPublish = prefs.defaultScoreForPublish ?? null
      publicJoinEnabled = prefs.publicJoinEnabled ?? true
    } else {
      const legacy = await db.payoutRule.findFirst({
        where: { workspaceId: organization.id } as any,
      })
      if (legacy) {
        defaultHonor = legacy.defaultHonor
        minPayout = legacy.minPayout
      }
    }

    return ok({
      workspace: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo ?? null,
      },
      payoutRules: { defaultHonor, minPayout },
      preferences: {
        defaultScoreForPublish,
        publicJoinEnabled,
        locale: "id",
      },
    })
  }, { authOrg: true })

  // PUT /api/orgs/:slug/settings/preferences — update workspace preferences
  .put("/api/orgs/:slug/settings/preferences", async ({ organization, body }) => {
    const existing = await db.workspacePreference.findUnique({
      where: { workspaceId: organization.id } as any,
    })

    const updateData: Record<string, unknown> = {}
    if (body.defaultScoreForPublish !== undefined) updateData.defaultScoreForPublish = body.defaultScoreForPublish
    if (body.publicJoinEnabled !== undefined) updateData.publicJoinEnabled = body.publicJoinEnabled

    if (existing) {
      const updated = await db.workspacePreference.update({
        where: { id: existing.id },
        data: updateData as any,
      })
      return ok(updated)
    }

    const created = await db.workspacePreference.create({
      data: {
        id: crypto.randomUUID(),
        workspaceId: organization.id,
        ...updateData,
      } as any,
    })
    return ok(created)
  }, {
    authOrg: true,
    body: t.Object({
      defaultScoreForPublish: t.Optional(t.Nullable(t.Number())),
      publicJoinEnabled: t.Optional(t.Boolean()),
    }),
  })

  // PUT /api/orgs/:slug/settings/profile — update workspace profile
  .put("/api/orgs/:slug/settings/profile", async ({ organization, body, request: { headers } }) => {
    try {
      const updateData: Record<string, unknown> = {}
      if (body.name) updateData.name = body.name
      if (body.slug) updateData.slug = body.slug
      if (body.logo !== undefined) updateData.logo = body.logo

      const updated = await (auth.api as any).updateOrganization({
        headers: Object.fromEntries(headers),
        body: {
          organizationId: organization.id,
          ...updateData,
        },
      })

      return ok(updated)
    } catch (e: any) {
      return fail(e.message ?? "Gagal memperbarui profil workspace")
    }
  }, {
    authOrg: true,
    body: t.Object({
      name: t.Optional(t.String()),
      slug: t.Optional(t.String()),
      logo: t.Optional(t.Nullable(t.String())),
    }),
  })

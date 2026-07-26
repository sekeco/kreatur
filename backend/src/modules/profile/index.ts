import { Elysia, t } from "elysia"
import { auth } from "../../auth"
import { authGuard } from "../auth-guard"
import { db } from "../../db/client"
import { ok, fail } from "../../lib/response"

export const profileRouter = new Elysia()
  .use(authGuard)

  // ─── GET /api/orgs/:slug/profile — user profile + preferences ──────
  .get("/api/orgs/:slug/profile", async ({ user, request: { headers } }) => {
    const headersObj = Object.fromEntries(headers)

    // Ambil profile dari UserProfile
    let profile = await db.userProfile.findUnique({
      where: { userId: user.id } as any,
    })

    // Buat default jika belum ada
    if (!profile) {
      profile = await db.userProfile.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          timezone: "Asia/Jakarta",
          locale: "id",
        } as any,
      })
    }

    // Ambil daftar akun terhubung (OAuth)
    const accounts = await db.account.findMany({
      where: { userId: user.id } as any,
      select: { id: true, providerId: true, accountId: true, createdAt: true },
    })

    // Cek apakah user punya password (credential account)
    const credentialAccount = await db.account.findFirst({
      where: { userId: user.id, providerId: "credential" } as any,
    })

    // Ambil sesi aktif
    const sessions = await auth.api.listSessions({
      headers: headersObj,
    })

    // Dapatkan current session token dari cookie
    const cookie = headersObj.cookie ?? headersObj["Cookie"] ?? ""
    const currentToken = cookie
      .split(";")
      .find((c: string) => c.trim().startsWith("session_token="))
      ?.split("=")[1]
      ?.trim()

    return ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image ?? null,
        twoFactorEnabled: (user as any).twoFactorEnabled ?? false,
        createdAt: user.createdAt,
      },
      profile: {
        phone: profile.phone ?? null,
        bio: profile.bio ?? null,
        timezone: profile.timezone,
        locale: profile.locale,
        bankName: profile.bankName ?? null,
        bankAccountNumber: profile.bankAccountNumber ?? null,
        bankAccountName: profile.bankAccountName ?? null,
        metadata: profile.metadata ? JSON.parse(profile.metadata) : null,
      },
      accounts: accounts.map((a: any) => ({
        id: a.id,
        provider: a.providerId,
        accountId: a.accountId,
        linkedAt: a.createdAt,
      })),
      hasPassword: !!credentialAccount,
      sessions: (sessions ?? []).map((s: any) => ({
        id: s.id,
        token: s.token,
        createdAt: s.createdAt,
        userAgent: s.userAgent ?? null,
        ipAddress: s.ipAddress ?? null,
        expiresAt: s.expiresAt,
        isCurrent: s.token === currentToken,
      })),
    })
  }, { auth: true })

  // ─── PUT /api/orgs/:slug/profile — update user profile ────────────
  .put("/api/orgs/:slug/profile", async ({ user, body, request: { headers } }) => {
    const headersObj = Object.fromEntries(headers)

    const existing = await db.userProfile.findUnique({
      where: { userId: user.id } as any,
    })

    const updateData: Record<string, unknown> = {}
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.timezone !== undefined) updateData.timezone = body.timezone
    if (body.locale !== undefined) updateData.locale = body.locale
    if (body.bankName !== undefined) updateData.bankName = body.bankName
    if (body.bankAccountNumber !== undefined) updateData.bankAccountNumber = body.bankAccountNumber
    if (body.bankAccountName !== undefined) updateData.bankAccountName = body.bankAccountName

    // Update nama user di Better Auth via API
    if (body.name !== undefined) {
      await (auth.api as any).updateUser({
        headers: headersObj,
        body: { name: body.name },
      })
    }

    if (existing) {
      const updated = await db.userProfile.update({
        where: { userId: user.id } as any,
        data: updateData as any,
      })
      return ok(updated)
    }

    const created = await db.userProfile.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        ...updateData,
      } as any,
    })
    return ok(created)
  }, {
    auth: true,
    body: t.Object({
      name: t.Optional(t.String()),
      phone: t.Optional(t.String()),
      bio: t.Optional(t.String()),
      timezone: t.Optional(t.String()),
      locale: t.Optional(t.String()),
      bankName: t.Optional(t.String()),
      bankAccountNumber: t.Optional(t.String()),
      bankAccountName: t.Optional(t.String()),
    }),
  })

  // ─── PUT /api/orgs/:slug/profile/avatar — update avatar ──────────
  .put("/api/orgs/:slug/profile/avatar", async ({ user, body, request: { headers } }) => {
    try {
      const updated = await (auth.api as any).updateUser({
        headers: Object.fromEntries(headers),
        body: { image: body.image },
      })
      return ok(updated)
    } catch (e: any) {
      return fail(e.message ?? "Gagal memperbarui avatar")
    }
  }, {
    auth: true,
    body: t.Object({ image: t.String() }),
  })

  // ─── PUT /api/orgs/:slug/profile/password — ganti password ──────
  .put("/api/orgs/:slug/profile/password", async ({ body, request: { headers } }) => {
    try {
      const result = await auth.api.changePassword({
        headers: Object.fromEntries(headers),
        body: {
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
        },
      })
      return ok({ changed: true })
    } catch (e: any) {
      return fail(e.message ?? "Gagal mengubah password")
    }
  }, {
    auth: true,
    body: t.Object({
      currentPassword: t.String(),
      newPassword: t.String({ minLength: 8 }),
    }),
  })

  // ─── GET /api/orgs/:slug/profile/sessions — daftar sesi aktif ──
  .get("/api/orgs/:slug/profile/sessions", async ({ request: { headers } }) => {
    const sessions = await auth.api.listSessions({
      headers: Object.fromEntries(headers),
    })
    return ok(sessions ?? [])
  }, { auth: true })

  // ─── DELETE /api/orgs/:slug/profile/sessions/:token — revoke sesi ──
  .delete("/api/orgs/:slug/profile/sessions/:token", async ({ params, request: { headers } }) => {
    try {
      await auth.api.revokeSession({
        headers: Object.fromEntries(headers),
        body: { token: params.token },
      })
      return ok({ revoked: true })
    } catch (e: any) {
      return fail(e.message ?? "Gagal mencabut sesi")
    }
  }, {
    auth: true,
    params: t.Object({ slug: t.String(), token: t.String() }),
  })

  // ─── DELETE /api/orgs/:slug/profile/accounts/:id — unlink OAuth ──
  .delete("/api/orgs/:slug/profile/accounts/:id", async ({ params, request: { headers } }) => {
    try {
      await (auth.api as any).unlinkAccount({
        headers: Object.fromEntries(headers),
        body: { providerId: params.id },
      })
      return ok({ unlinked: true })
    } catch (e: any) {
      return fail(e.message ?? "Gagal memutuskan akun")
    }
  }, {
    auth: true,
    params: t.Object({ slug: t.String(), id: t.String() }),
  })

  // ─── Two-Factor: Enable ──────────────────────────────────────────
  .post("/api/orgs/:slug/profile/2fa/enable", async ({ body, request: { headers } }) => {
    try {
      const result = await auth.api.enableTwoFactor({
        headers: Object.fromEntries(headers),
        body: { password: body.password },
      })
      return ok({
        totpURI: result.totpURI,
        backupCodes: result.backupCodes,
      })
    } catch (e: any) {
      return fail(e.message ?? "Gagal mengaktifkan 2FA")
    }
  }, {
    auth: true,
    body: t.Object({ password: t.String() }),
  })

  // ─── Two-Factor: Verify TOTP ─────────────────────────────────────
  .post("/api/orgs/:slug/profile/2fa/verify", async ({ body, request: { headers } }) => {
    try {
      const result = await auth.api.verifyTOTP({
        headers: Object.fromEntries(headers),
        body: { code: body.code, trustDevice: body.trustDevice ?? false },
      })
      return ok(result)
    } catch (e: any) {
      return fail(e.message ?? "Kode TOTP tidak valid")
    }
  }, {
    auth: true,
    body: t.Object({
      code: t.String(),
      trustDevice: t.Optional(t.Boolean()),
    }),
  })

  // ─── Two-Factor: Disable ─────────────────────────────────────────
  .post("/api/orgs/:slug/profile/2fa/disable", async ({ body, request: { headers } }) => {
    try {
      const result = await auth.api.disableTwoFactor({
        headers: Object.fromEntries(headers),
        body: { password: body.password },
      })
      return ok(result)
    } catch (e: any) {
      return fail(e.message ?? "Gagal menonaktifkan 2FA")
    }
  }, {
    auth: true,
    body: t.Object({ password: t.String() }),
  })

  // ─── Two-Factor: View Backup Codes ───────────────────────────────
  .get("/api/orgs/:slug/profile/2fa/backup-codes", async ({ request: { headers } }) => {
    try {
      const result = await auth.api.viewBackupCodes({
        headers: Object.fromEntries(headers),
        body: {},
      })
      return ok(result)
    } catch (e: any) {
      return fail(e.message ?? "Gagal mengambil kode cadangan")
    }
  }, { auth: true })

  // ─── Two-Factor: Regenerate Backup Codes ─────────────────────────
  .post("/api/orgs/:slug/profile/2fa/backup-codes", async ({ body, request: { headers } }) => {
    try {
      const result = await auth.api.generateBackupCodes({
        headers: Object.fromEntries(headers),
        body: { password: body.password },
      })
      return ok(result)
    } catch (e: any) {
      return fail(e.message ?? "Gagal membuat kode cadangan baru")
    }
  }, {
    auth: true,
    body: t.Object({ password: t.String() }),
  })

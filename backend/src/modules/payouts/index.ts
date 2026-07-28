import { Elysia, t } from "elysia"
import { authGuard } from "../auth-guard"
import { ok, fail, okPaginated } from "../../lib/response"
import * as payoutService from "./service"

export const payoutsRouter = new Elysia()
  .use(authGuard)

  // GET /api/orgs/:slug/payout-rules — aturan honor
  .get("/api/orgs/:slug/payout-rules", async ({ organization }) => {
    const rules = await payoutService.getRules(organization.id)
    return ok(rules ?? { defaultHonor: 50000, minPayout: 50000 })
  }, { authOrg: true })

  // PUT /api/orgs/:slug/payout-rules — update aturan honor
  .put("/api/orgs/:slug/payout-rules", async ({ organization, body }) => {
    const rules = await payoutService.upsertRules(organization.id, body)
    return ok(rules)
  }, {
    authOrg: true,
    body: t.Object({
      defaultHonor: t.Optional(t.Number()),
      minPayout: t.Optional(t.Number()),
    }),
  })

  // GET /api/orgs/:slug/payouts — daftar payout request
  .get("/api/orgs/:slug/payouts", async ({ organization, query }) => {
    const {
      status, contributorId, search,
      page: pg = "1", pageSize: ps = "20",
    } = query
    const page = Number(pg), pageSize = Number(ps)
    const { rows, total } = await payoutService.findMany(organization.id, {
      status, contributorId, search, page, pageSize,
    })
    return okPaginated(rows, total, page, pageSize)
  }, {
    authOrg: true,
    query: t.Object({
      status: t.Optional(t.String()),
      contributorId: t.Optional(t.String()),
      search: t.Optional(t.String()),
      page: t.Optional(t.String()),
      pageSize: t.Optional(t.String()),
    }),
  })

  // GET /api/orgs/:slug/payouts/eligible-articles — artikel yang bisa diajukan payout
  .get("/api/orgs/:slug/payouts/eligible-articles", async ({ organization, query }) => {
    const articles = await payoutService.findEligibleArticles(organization.id, query.authorId)
    return ok(articles)
  }, {
    authOrg: true,
    query: t.Object({
      authorId: t.String(),
    }),
  })

  // POST /api/orgs/:slug/payouts — buat payout request baru
  .post("/api/orgs/:slug/payouts", async ({ organization, body }) => {
    try {
      const payout = await payoutService.create({
        workspaceId: organization.id,
        contributorId: body.contributorId,
        bankName: body.bankName,
        bankAccountNumber: body.bankAccountNumber,
        bankAccountName: body.bankAccountName,
        articleIds: body.articleIds,
      })
      return ok(payout)
    } catch (e: any) {
      return fail(e.message ?? "Gagal membuat pengajuan payout")
    }
  }, {
    authOrg: true,
    body: t.Object({
      contributorId: t.String(),
      bankName: t.String(),
      bankAccountNumber: t.String(),
      bankAccountName: t.String(),
      articleIds: t.Array(t.String()),
    }),
  })

  // GET /api/orgs/:slug/payouts/:id — detail payout
  .get("/api/orgs/:slug/payouts/:id", async ({ organization, params }) => {
    const payout = await payoutService.findById(params.id)
    if (!payout || (payout as any).workspaceId !== organization.id) return fail("Payout tidak ditemukan")
    return ok(payout)
  }, { authOrg: true, params: t.Object({ slug: t.String(), id: t.String() }) })

  // PUT /api/orgs/:slug/payouts/:id/status — update status payout
  .put("/api/orgs/:slug/payouts/:id/status", async ({ organization, params, body }) => {
    const existing = await payoutService.findById(params.id)
    if (!existing || (existing as any).workspaceId !== organization.id) return fail("Payout tidak ditemukan")

    const validTransitions: Record<string, string[]> = {
      PENDING: ["APPROVED", "REJECTED", "CANCELLED"],
      APPROVED: ["PROCESSING"],
      PROCESSING: ["COMPLETED"],
    }
    const allowed = validTransitions[(existing as any).status]
    if (!allowed?.includes(body.status)) {
      return fail(`Status tidak dapat diubah dari ${(existing as any).status} ke ${body.status}`)
    }

    const payout = await payoutService.updateStatus(params.id, body.status, body.reviewNotes)
    return ok(payout)
  }, {
    authOrg: true,
    params: t.Object({ slug: t.String(), id: t.String() }),
    body: t.Object({
      status: t.String(),
      reviewNotes: t.Optional(t.String()),
    }),
  })

  // POST /api/orgs/:slug/payouts/:id/cancel — batalkan payout oleh kontributor
  .post("/api/orgs/:slug/payouts/:id/cancel", async ({ user, organization, params, body }) => {
    const existing = await payoutService.findById(params.id)
    if (!existing || (existing as any).workspaceId !== organization.id) {
      return fail("Payout tidak ditemukan")
    }
    if ((existing as any).status !== "PENDING") {
      return fail("Hanya payout dengan status PENDING yang bisa dibatalkan")
    }
    if ((existing as any).contributorId !== user.id) {
      return fail("Anda tidak memiliki izin untuk membatalkan payout ini")
    }

    const payout = await payoutService.cancelPayout(params.id, body.reason)
    return ok(payout)
  }, {
    authOrg: true,
    params: t.Object({ slug: t.String(), id: t.String() }),
    body: t.Object({ reason: t.String() }),
  })

  // POST /api/orgs/:slug/payouts/:id/proof — upload bukti transfer
  .post("/api/orgs/:slug/payouts/:id/proof", async ({ organization, params, body }) => {
    const existing = await payoutService.findById(params.id)
    if (!existing || (existing as any).workspaceId !== organization.id) return fail("Payout tidak ditemukan")
    if ((existing as any).status !== "PROCESSING") return fail("Hanya payout dengan status PROCESSING yang bisa diupload bukti")

    const payout = await payoutService.updateProof(params.id, body.proofUrl)
    return ok(payout)
  }, {
    authOrg: true,
    params: t.Object({ slug: t.String(), id: t.String() }),
    body: t.Object({ proofUrl: t.String() }),
  })

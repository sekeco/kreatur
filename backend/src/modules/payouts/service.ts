import { db } from "../../db/client"

// ─── Payout Rules (via WorkspacePreference) ──────────────────

export async function getRules(workspaceId: string) {
  const prefs = await db.workspacePreference.findUnique({
    where: { workspaceId } as any,
  })
  if (prefs) {
    return { defaultHonor: prefs.defaultHonor, minPayout: prefs.minPayout }
  }
  // Fallback ke PayoutRule lama
  const legacy = await db.payoutRule.findFirst({
    where: { workspaceId } as any,
  })
  return legacy ?? null
}

export async function upsertRules(workspaceId: string, data: {
  defaultHonor?: number
  minPayout?: number
}) {
  const existing = await db.workspacePreference.findUnique({
    where: { workspaceId } as any,
  })
  if (existing) {
    return db.workspacePreference.update({
      where: { id: existing.id },
      data: data as any,
    })
  }
  return db.workspacePreference.create({
    data: {
      id: crypto.randomUUID(),
      workspaceId,
      defaultHonor: data.defaultHonor ?? 100000,
      minPayout: data.minPayout ?? 50000,
    } as any,
  })
}

// ─── Payout Requests ─────────────────────────────────────

export async function findMany(workspaceId: string, opts: {
  status?: string
  contributorId?: string
  search?: string
  page: number
  pageSize: number
}) {
  const { status, contributorId, search, page, pageSize } = opts
  const where: Record<string, unknown> = { workspaceId }
  if (status) where.status = status
  if (contributorId) where.contributorId = contributorId
  if (search) {
    where.contributor = { name: { contains: search, mode: "insensitive" } }
  }
  const [rows, total] = await Promise.all([
    db.payoutRequest.findMany({
      where: where as any,
      include: {
        payoutArticles: { include: { article: { select: { id: true, title: true } } } },
        contributor: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.payoutRequest.count({ where: where as any }),
  ])
  return { rows, total }
}

export async function findById(id: string) {
  return db.payoutRequest.findFirst({
    where: { id } as any,
    include: {
      payoutArticles: { include: { article: { select: { id: true, title: true, honor: true } } } },
      contributor: { select: { id: true, name: true, email: true, image: true } },
    },
  })
}

// ─── Eligible Articles ─────────────────────────────────

/**
 * Mengembalikan artikel milik seorang author yang statusnya APPROVED/PUBLISHED
   * DAN tidak memiliki payout request aktif (PENDING/APPROVED/PROCESSING/COMPLETED).
   * Artikel dengan payout REJECTED atau CANCELLED tetap eligible (bisa diajukan ulang).
 */
export async function findEligibleArticles(workspaceId: string, authorId: string) {
  const articles = await db.article.findMany({
    where: {
      workspaceId,
      authorId,
      status: { in: ["APPROVED", "PUBLISHED"] },
      // Exclude artikel yang sudah punya payout aktif (selain REJECTED/CANCELLED)
      payoutArticles: {
        none: {
          payoutRequest: {
            contributorId: authorId,
            status: { notIn: ["REJECTED", "CANCELLED"] },
          },
        },
      },
    } as any,
    select: { id: true, title: true, honor: true, status: true },
    orderBy: { updatedAt: "desc" },
  })
  return articles
}

export async function create(data: {
  workspaceId: string
  contributorId: string
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  articleIds: string[]
}) {
  const { workspaceId, contributorId, bankName, bankAccountNumber, bankAccountName, articleIds } = data

  // Hitung total honor dari artikel yang dipilih
  const articles = await db.article.findMany({
    where: {
      id: { in: articleIds },
      workspaceId,
      status: { in: ["APPROVED", "PUBLISHED"] },
    } as any,
    select: { id: true, honor: true },
  })

  if (articles.length === 0) {
    throw new Error("Tidak ada artikel valid yang dipilih")
  }

  // Cek apakah ada artikel yang sudah punya payout non-REJECTED
  const articlesWithActivePayout = await db.payoutArticle.findMany({
    where: {
      articleId: { in: articleIds },
      payoutRequest: {
        contributorId,
        status: { notIn: ["REJECTED", "CANCELLED"] },
      },
    } as any,
    select: { articleId: true },
  })

  if (articlesWithActivePayout.length > 0) {
    throw new Error("Beberapa artikel sudah memiliki pengajuan pencairan yang aktif")
  }

  const totalAmount = articles.reduce((sum, a) => sum + (a.honor ?? 0), 0)

  const payout = await db.payoutRequest.create({
    data: {
      workspaceId,
      contributorId,
      totalAmount,
      bankName,
      bankAccountNumber,
      bankAccountName,
      status: "PENDING",
      payoutArticles: {
        create: articles.map((a) => ({
          articleId: a.id,
          amount: a.honor ?? 0,
        })),
      },
    } as any,
    include: {
      payoutArticles: { include: { article: { select: { id: true, title: true } } } },
      contributor: { select: { id: true, name: true, email: true } },
    },
  })

  return payout
}

export async function updateStatus(id: string, status: string, reviewNotes?: string) {
  const updateData: Record<string, unknown> = { status }
  if (status === "APPROVED" || status === "PROCESSING") {
    updateData.processedAt = new Date()
  }
  if (status === "COMPLETED") {
    updateData.completedAt = new Date()
    if (!reviewNotes) updateData.processedAt = new Date()
  }
  if (status === "CANCELLED") {
    updateData.completedAt = new Date()
  }
  if (reviewNotes) updateData.reviewNotes = reviewNotes

  return db.payoutRequest.update({
    where: { id } as any,
    data: updateData as any,
    include: {
      payoutArticles: { include: { article: { select: { id: true, title: true } } } },
      contributor: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function cancelPayout(id: string, reason: string) {
  return db.payoutRequest.update({
    where: { id } as any,
    data: {
      status: "CANCELLED",
      reviewNotes: reason,
      completedAt: new Date(),
    } as any,
    include: {
      payoutArticles: { include: { article: { select: { id: true, title: true } } } },
      contributor: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function updateProof(id: string, proofUrl: string) {
  return db.payoutRequest.update({
    where: { id } as any,
    data: { proofUrl, status: "COMPLETED", completedAt: new Date() } as any,
  })
}

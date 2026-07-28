import { db } from "../../db/client"

export type ArticleWithRelations = Awaited<ReturnType<typeof findById>>

const articleInclude = {
  author: true,
  reviewer: true,
  category: true,
  reviews: true,
} as const

export async function findMany(workspaceId: string, opts: {
  status?: string
  categoryId?: string
  authorId?: string
  search?: string
  page: number
  pageSize: number
}) {
  const { status, categoryId, authorId, search, page, pageSize } = opts
  const where: Record<string, unknown> = { workspaceId }
  if (status) where.status = status
  if (categoryId) where.categoryId = categoryId
  if (authorId) where.authorId = authorId
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
    ]
  }
  const [rows, total] = await Promise.all([
    db.article.findMany({
      where: where as any,
      include: articleInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.article.count({ where: where as any }),
  ])
  return { rows, total }
}

export async function findById(id: string) {
  return db.article.findFirst({
    where: { id },
    include: {
      ...articleInclude,
      events: { orderBy: { createdAt: "desc" } },
    },
  })
}

export async function create(data: {
  title: string
  slug: string
  excerpt?: string
  content?: string
  categoryId?: string
  coverImageUrl?: string | null
  authorId: string
  workspaceId: string
}) {
  return db.article.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt ?? null,
      content: data.content ?? null,
      categoryId: data.categoryId ?? null,
      coverImageUrl: data.coverImageUrl ?? null,
      authorId: data.authorId,
      workspaceId: data.workspaceId,
    },
    include: articleInclude,
  })
}

export async function update(id: string, data: {
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  categoryId?: string | null
  status?: string
  reviewerId?: string | null
  honor?: number | null
  coverImageUrl?: string | null
}) {
  return db.article.update({
    where: { id },
    data: data as any,
    include: articleInclude,
  })
}

export async function remove(id: string) {
  return db.article.delete({ where: { id } })
}

export async function submitForReview(id: string, reviewerId: string) {
  return db.article.update({
    where: { id },
    data: { status: "PENDING_REVIEW", reviewerId },
    include: articleInclude,
  })
}

export async function reviewArticle(id: string, data: {
  decision: "APPROVED" | "REVISION_REQUESTED" | "REJECTED"
  score?: number
  notes?: string
  reviewerId: string
  autoPublishScore?: number
  honor?: number | null
}) {
  const { decision, score, notes, reviewerId, autoPublishScore, honor } = data

  // Buat review record
  await db.articleReview.create({
    data: {
      articleId: id,
      reviewerId,
      score: score ?? null,
      notes: notes ?? null,
      decision,
    },
  })

  // Tentukan status baru
  let newStatus: string
  switch (decision) {
    case "APPROVED":
      // Auto-publish jika skor >= threshold
      if (autoPublishScore !== undefined && score !== undefined && score >= autoPublishScore) {
        newStatus = "PUBLISHED"
      } else {
        newStatus = "APPROVED"
      }
      break
    case "REJECTED":
      newStatus = "REJECTED"
      break
    default:
      newStatus = "REVISION_REQUESTED"
  }

  const updateData: Record<string, unknown> = { status: newStatus }
  if (newStatus === "APPROVED" || newStatus === "PUBLISHED") {
    updateData.publishedAt = new Date()
  }
  // Simpan honor jika dikirim (untuk APPROVED/PUBLISHED)
  if (honor !== undefined) {
    updateData.honor = honor
  }
  const article = await db.article.update({
    where: { id },
    data: updateData as any,
    include: articleInclude,
  })

  return article
}

export async function publishArticle(id: string) {
  return db.article.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
    include: articleInclude,
  })
}

export async function archiveArticle(id: string) {
  return db.article.update({
    where: { id },
    data: { status: "ARCHIVED" },
    include: articleInclude,
  })
}

export async function getEvents(articleId: string) {
  return db.articleEvent.findMany({
    where: { articleId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function createEvent(data: {
  articleId: string
  userId: string
  eventType: string
  metadata?: string
}) {
  return db.articleEvent.create({ data })
}

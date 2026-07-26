import { Elysia, t } from "elysia"
import { authGuard } from "../auth-guard"
import { db } from "../../db/client"
import { ok } from "../../lib/response"

function monthStart() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function weekAgo() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
}

export const dashboardRouter = new Elysia()
  .use(authGuard)

  // GET /api/orgs/:slug/dashboard — aggregated stats
  .get("/api/orgs/:slug/dashboard", async ({ organization }) => {
    const wsId = organization.id
    const startOfMonth = monthStart()
    const sevenDaysAgo = weekAgo()

    const [
      workspace,
      totalArticles,
      pendingReview,
      draft,
      published,
      approved,
      rejected,
      revisionRequested,
      honorThisMonth,
      activeContributors,
      totalCategories,
      connectedWP,
      pendingPayouts,
      stalledDrafts,
    ] = await Promise.all([
      db.organization.findUnique({ where: { id: wsId }, select: { name: true, slug: true, logo: true } }),
      db.article.count({ where: { workspaceId: wsId } as any }),
      db.article.count({ where: { workspaceId: wsId, status: "PENDING_REVIEW" } as any }),
      db.article.count({ where: { workspaceId: wsId, status: "DRAFT" } as any }),
      db.article.count({ where: { workspaceId: wsId, status: "PUBLISHED" } as any }),
      db.article.count({ where: { workspaceId: wsId, status: "APPROVED" } as any }),
      db.article.count({ where: { workspaceId: wsId, status: "REJECTED" } as any }),
      db.article.count({ where: { workspaceId: wsId, status: "REVISION_REQUESTED" } as any }),
      // Honor bulan ini: sum honor dari APPROVED/PUBLISHED articles bulan ini
      db.article.aggregate({
        where: {
          workspaceId: wsId,
          status: { in: ["APPROVED", "PUBLISHED"] },
          updatedAt: { gte: startOfMonth },
        } as any,
        _sum: { honor: true },
      }),
      // Kontributor aktif: distinct authors yang punya artikel APPROVED/PUBLISHED bulan ini
      db.article.groupBy({
        by: ["authorId"],
        where: {
          workspaceId: wsId,
          status: { in: ["APPROVED", "PUBLISHED"] },
        } as any,
        _count: true,
      }),
      db.category.count({ where: { workspaceId: wsId } as any }),
      db.workspaceConnection.count({
        where: { workspaceId: wsId, type: "wordpress", status: "connected" } as any,
      }),
      db.payoutRequest.count({
        where: { workspaceId: wsId, status: "PENDING" } as any,
      }),
      // Draft yang tidak diedit >7 hari
      db.article.count({
        where: {
          workspaceId: wsId,
          status: "DRAFT",
          updatedAt: { lt: sevenDaysAgo },
        } as any,
      }),
    ])

    return ok({
      workspaceName: (workspace as any)?.name ?? organization.slug,
      workspaceSlug: organization.slug,
      totalArticles,
      pendingReview,
      draft,
      published,
      approved,
      rejected,
      revisionRequested,
      stalledDrafts,
      honorThisMonth: (honorThisMonth as any)?._sum?.honor ?? 0,
      activeContributors: activeContributors.length,
      totalCategories,
      connectedWP,
      pendingPayouts,
    })
  }, { authOrg: true })

  // GET /api/orgs/:slug/dashboard/activity — recent activity timeline
  .get("/api/orgs/:slug/dashboard/activity", async ({ organization }) => {
    const wsId = organization.id
    const events = await db.articleEvent.findMany({
      where: { article: { workspaceId: wsId } } as any,
      include: {
        user: { select: { id: true, name: true, image: true } },
        article: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    return ok(events)
  }, { authOrg: true })

  // GET /api/orgs/:slug/dashboard/contributor — data dashboard khusus kontributor
  .get("/api/orgs/:slug/dashboard/contributor", async ({ organization, user }) => {
    const wsId = organization.id
    const uid = user.id
    const startOfMonth = monthStart()

    const [
      totalArticles,
      myDrafts,
      myPendingReview,
      myPublished,
      myApproved,
      myRevisionRequested,
      myHonorThisMonth,
      myHonorTotal,
    ] = await Promise.all([
      db.article.count({ where: { workspaceId: wsId, authorId: uid } } as any),
      db.article.count({ where: { workspaceId: wsId, authorId: uid, status: "DRAFT" } } as any),
      db.article.count({ where: { workspaceId: wsId, authorId: uid, status: "PENDING_REVIEW" } } as any),
      db.article.count({ where: { workspaceId: wsId, authorId: uid, status: "PUBLISHED" } } as any),
      db.article.count({ where: { workspaceId: wsId, authorId: uid, status: "APPROVED" } } as any),
      db.article.count({ where: { workspaceId: wsId, authorId: uid, status: "REVISION_REQUESTED" } } as any),
      // Honor bulan ini
      db.article.aggregate({
        where: {
          workspaceId: wsId,
          authorId: uid,
          status: { in: ["APPROVED", "PUBLISHED"] },
          updatedAt: { gte: startOfMonth },
        } as any,
        _sum: { honor: true },
      }),
      // Honor total
      db.article.aggregate({
        where: {
          workspaceId: wsId,
          authorId: uid,
          status: { in: ["APPROVED", "PUBLISHED"] },
        } as any,
        _sum: { honor: true },
      }),
    ])

    // Aktivitas milik sendiri
    const activities = await db.articleEvent.findMany({
      where: { article: { workspaceId: wsId, authorId: uid } } as any,
      include: {
        user: { select: { id: true, name: true, image: true } },
        article: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return ok({
      totalArticles,
      myDrafts,
      myPendingReview,
      myPublished,
      myApproved,
      myRevisionRequested,
      myHonorThisMonth: (myHonorThisMonth as any)?._sum?.honor ?? 0,
      myHonorTotal: (myHonorTotal as any)?._sum?.honor ?? 0,
      activities,
    })
  }, { authOrg: true })

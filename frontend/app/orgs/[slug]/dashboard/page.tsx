"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { Clock, FileEdit, MessageSquare } from "lucide-react"

import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/eden-client"
import { MetricCards } from "./_components/metric-cards"
import {
  PendingActions,
  type PendingActionItem,
} from "./_components/pending-actions"
import { QuickStats, type QuickStatItem } from "./_components/quick-stats"
import { RecentActivity } from "./_components/recent-activity"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Types ──────────────────────────────────────────────

interface ContributorData {
  totalArticles: number
  myDrafts: number
  myPendingReview: number
  myPublished: number
  myApproved: number
  myRevisionRequested: number
  myHonorThisMonth: number
  myHonorTotal: number
  activities: Array<{
    id: string
    eventType: string
    metadata?: string | null
    createdAt: string
    user: { id: string; name: string; image?: string | null }
    article: { id: string; title: string }
  }>
}

type ActivityItem = ContributorData["activities"][number]

interface OrgData {
  workspaceName: string
  workspaceSlug: string
  totalArticles: number
  pendingReview: number
  draft: number
  published: number
  approved: number
  rejected: number
  revisionRequested: number
  stalledDrafts: number
  honorThisMonth: number
  activeContributors: number
  totalCategories: number
  connectedWP: number
  pendingPayouts: number
}

// ─── Helper: map Better Auth role ke internal role ─────

function normalizeRole(raw: string): string {
  const r = raw.toLowerCase()
  return r === "member" ? "contributor" : r
}

// ─── Page ───────────────────────────────────────────────

export default function DashboardPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [userRole, setUserRole] = React.useState<string | null>(null)
  const [userName, setUserName] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)

  // Data per role
  const [contributorData, setContributorData] =
    React.useState<ContributorData | null>(null)
  const [orgData, setOrgData] = React.useState<OrgData | null>(null)
  const [activities, setActivities] = React.useState<ActivityItem[]>([])

  // ── Get role & fetch data ──
  React.useEffect(() => {
    if (!slug) return

    // Ambil role user
    authClient.organization.getActiveMemberRole({}).then(async (roleRes) => {
      let role = "owner"
      if (roleRes.data?.role) {
        role = normalizeRole(
          Array.isArray(roleRes.data.role)
            ? roleRes.data.role[0]
            : roleRes.data.role
        )
      }
      setUserRole(role)

      // Ambil nama user dari session
      const session = await authClient.getSession()
      if (session.data?.user?.name) {
        setUserName(session.data.user.name)
      }

      setLoading(true)

      if (role === "contributor") {
        // Fetch contributor-specific dashboard
        const [dashRes] = await Promise.all([
          api.api.orgs({ slug }).dashboard.contributor.get(),
        ])
        if (dashRes.data?.success) {
          setContributorData(dashRes.data.data as unknown as ContributorData)
        }
      } else {
        // Fetch org-wide dashboard
        const [dashRes, actRes] = await Promise.all([
          api.api.orgs({ slug }).dashboard.get(),
          api.api.orgs({ slug }).dashboard.activity.get(),
        ])
        if (dashRes.data?.success) {
          setOrgData(dashRes.data.data as unknown as OrgData)
        }
        if (actRes.data?.success && Array.isArray(actRes.data.data)) {
          setActivities(actRes.data.data as unknown as ActivityItem[])
        }
      }

      setLoading(false)
    })
  }, [slug])

  // ── Loading ──
  if (loading) {
    return (
      <div className="@container/main flex flex-col items-center justify-center gap-4 py-24">
        <Spinner />
        <p className="text-sm text-muted-foreground">Memuat dashboard...</p>
      </div>
    )
  }

  // ================================================================
  //  CONTRIBUTOR DASHBOARD
  // ================================================================
  if (userRole === "contributor") {
    const d = contributorData
    if (!d) {
      return (
        <div className="@container/main py-24 text-center text-sm text-muted-foreground">
          Tidak ada data dashboard.
        </div>
      )
    }

    const pendingActions: PendingActionItem[] = [
      {
        icon: FileEdit,
        title: "Draft Belum Selesai",
        description: "Artikel yang masih perlu ditulis",
        count: d.myDrafts,
        href: "/articles?status=DRAFT",
      },
      {
        icon: Clock,
        title: "Menunggu Review",
        description: "Artikel sedang ditinjau",
        count: d.myPendingReview,
        href: "/articles?status=PENDING_REVIEW",
      },
      {
        icon: MessageSquare,
        title: "Revisi Diminta",
        description: "Perlu perbaikan dari Anda",
        count: d.myRevisionRequested,
        href: "/articles?status=REVISION_REQUESTED",
      },
    ].filter((item) => item.count > 0)

    const quickStats: QuickStatItem[] = [
      {
        label: "Total Artikel",
        value: d.totalArticles.toString(),
        sublabel: "Sepanjang waktu",
      },
      {
        label: "Honor Total",
        value: formatCurrency(d.myHonorTotal),
        sublabel: "Akumulasi",
      },
      {
        label: "Disetujui",
        value: d.myApproved.toString(),
        sublabel: "Siap terbit",
      },
      {
        label: "Diterbitkan",
        value: d.myPublished.toString(),
        sublabel: "Sudah tayang",
      },
    ]

    return (
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-medium">Dashboard Saya</h1>
          <p className="text-sm text-muted-foreground">
            Selamat datang kembali,{" "}
            <span className="font-medium text-foreground">{userName}</span>.
          </p>
        </div>

        {/* Metric Cards — spesifik kontributor */}
        <MetricCards
          totalArticles={d.totalArticles}
          pendingReview={d.myPendingReview}
          draft={d.myDrafts}
          published={d.myPublished + d.myApproved}
        />

        {/* Grid 2 kolom */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RecentActivity events={d.activities} />
          </div>
          <div className="flex flex-col gap-4">
            <PendingActions
              items={pendingActions}
              title="Aktivitas Artikel"
              description="Status artikel Anda saat ini."
            />
            <QuickStats
              items={quickStats}
              title="Ringkasan Saya"
              description="Statistik pribadi Anda."
            />
          </div>
        </div>
      </div>
    )
  }

  // ================================================================
  //  EDITOR / REVIEWER / OWNER DASHBOARD (existing layout)
  // ================================================================
  // Untuk Editor, Reviewer, Owner — pakai dashboard org-wide yang sudah ada
  const d = orgData ?? {
    workspaceName: slug,
    workspaceSlug: slug,
    totalArticles: 0,
    pendingReview: 0,
    draft: 0,
    published: 0,
    approved: 0,
    rejected: 0,
    revisionRequested: 0,
    stalledDrafts: 0,
    honorThisMonth: 0,
    activeContributors: 0,
    totalCategories: 0,
    connectedWP: 0,
    pendingPayouts: 0,
    activities: [],
  }

  const allActivities = activities

  const ownerPendingActions: PendingActionItem[] = [
    {
      icon: FileEdit,
      title: "Menunggu Review",
      description: "Artikel yang perlu ditinjau",
      count: d.pendingReview,
      href: "/articles?status=PENDING_REVIEW",
    },
    {
      icon: MessageSquare,
      title: "Revisi Diminta",
      description: "Menunggu perbaikan kontributor",
      count: d.revisionRequested,
      href: "/articles?status=REVISION_REQUESTED",
    },
    {
      icon: Clock,
      title: "Draft Terlantar",
      description: "Tidak diedit &gt;7 hari",
      count: d.stalledDrafts,
      href: "/articles?status=DRAFT",
    },
  ]

  // Filter untuk masing-masing role
  const visiblePendingActions =
    userRole === "editor" || userRole === "reviewer"
      ? ownerPendingActions.slice(0, 2) // hanya review + revisi
      : userRole === "finance"
        ? [] // finance tidak lihat pending artikel
        : ownerPendingActions

  const ownerQuickStats: QuickStatItem[] = [
    {
      label: "Kontributor Aktif",
      value: d.activeContributors.toString(),
      sublabel: "Bulan ini",
    },
    {
      label: "Kategori",
      value: d.totalCategories.toString(),
      sublabel: "Aktif digunakan",
    },
    {
      label: "Koneksi WordPress",
      value: d.connectedWP.toString(),
      sublabel: d.connectedWP > 0 ? "Terhubung" : "Belum terhubung",
    },
    {
      label: "Honor Bulan Ini",
      value: formatCurrency(d.honorThisMonth),
      sublabel: "Artikel APPROVED/PUBLISHED",
    },
  ]

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang di ruang kerja{" "}
          <span className="font-medium text-foreground">{d.workspaceName}</span>
          .
        </p>
      </div>

      <MetricCards
        totalArticles={d.totalArticles}
        pendingReview={d.pendingReview}
        draft={d.draft}
        published={d.published}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentActivity events={allActivities} />
        </div>
        <div className="flex flex-col gap-4">
          <PendingActions items={visiblePendingActions} />
          <QuickStats items={ownerQuickStats} />
        </div>
      </div>
    </div>
  )
}

"use client"
"use no memo"

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  AlertCircle,
  ArrowDownWideNarrow,
  Download,
  Search,
} from "lucide-react"
import { useParams } from "next/navigation"
import * as React from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/eden-client"
import { filters, type PayoutRow, sortOptions } from "./_components/data"
import { PayoutsTable, payoutColumns } from "./_components/payouts-table"
import { RequestPayoutDialog } from "./_components/request-payout-dialog"

function mapApiPayout(p: any): PayoutRow {
  return {
    id: p.id,
    contributor: p.contributor?.name ?? "Unknown",
    contributorEmail: p.contributor?.email ?? "",
    totalAmount: p.totalAmount ?? 0,
    totalArticles: p.payoutArticles?.length ?? 0,
    status: p.status ?? "PENDING",
    requestedAt: p.requestedAt,
    processedAt: p.processedAt ?? null,
    completedAt: p.completedAt ?? null,
    bankName: p.bankName ?? "",
    bankAccountNumber: p.bankAccountNumber ?? "",
    bankAccountName: p.bankAccountName ?? "",
    reviewNotes: p.reviewNotes ?? null,
    articles: (p.payoutArticles ?? []).map((pa: any) => ({
      id: pa.article?.id ?? pa.articleId,
      title: pa.article?.title ?? "Artikel",
      amount: pa.amount ?? 0,
    })),
  }
}

export default function PayoutsPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [userRole, setUserRole] = React.useState<string | null>(null)
  const [userId, setUserId] = React.useState<string | null>(null)

  const [payouts, setPayouts] = React.useState<PayoutRow[]>([])
  const [minPayout, setMinPayout] = React.useState(0)
  const [eligibleTotalHonor, setEligibleTotalHonor] = React.useState(0)

  // Ambil role & user ID
  React.useEffect(() => {
    authClient.organization.getActiveMemberRole({}).then(({ data }) => {
      if (data?.role) {
        const raw = Array.isArray(data.role) ? data.role[0] : data.role
        const role =
          raw.toLowerCase() === "member" ? "contributor" : raw.toLowerCase()
        setUserRole(role)
      }
    })
    authClient.getSession().then(({ data }) => {
      if (data?.user?.id) {
        setUserId(data.user.id)
      }
    })
  }, [])

  const [refreshKey, setRefreshKey] = React.useState(0)

  // Ambil payout rules + eligible articles untuk contributor
  React.useEffect(() => {
    if (!slug || userRole !== "contributor" || !userId) return

    Promise.all([
      api.api.orgs({ slug })["payout-rules"].get(),
      api.api.orgs({ slug }).payouts["eligible-articles"].get({
        query: { authorId: userId },
      }),
    ]).then(([rulesRes, articlesRes]) => {
      const rulesData = (rulesRes.data as any)?.data
      if (rulesData?.minPayout) {
        setMinPayout(rulesData.minPayout)
      }
      const articles = ((articlesRes.data as any)?.data ?? []) as {
        honor: number
      }[]
      const total = articles.reduce((sum, a) => sum + (a.honor ?? 0), 0)
      setEligibleTotalHonor(total)
    })
  }, [slug, userRole, userId, refreshKey])

  React.useEffect(() => {
    if (!slug) return

    const query: Record<string, string> = { page: "1", pageSize: "100" }
    // Kontributor hanya lihat payout-nya sendiri
    if (userRole === "contributor" && userId) {
      query.contributorId = userId
    }

    api.api
      .orgs({ slug })
      .payouts.get({ query })
      .then(({ data }) => {
        if (data?.success && Array.isArray(data.data)) {
          setPayouts(data.data.map(mapApiPayout))
        }
      })
  }, [slug, userRole, userId, refreshKey])

  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "requestedAt", desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ search: false })

  // Sembunyikan kolom select & bank untuk kontributor
  React.useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      select: userRole === "contributor" ? false : true,
      bankInfo: userRole === "contributor" ? false : true,
    }))
  }, [userRole])
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data: payouts,
    columns: payoutColumns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    enableRowSelection: userRole !== "contributor",
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      slug,
      userRole,
      refreshPayouts: () => setRefreshKey((k) => k + 1),
    } as any,
  })

  const searchQuery =
    (table.getColumn("search")?.getFilterValue() as string | undefined) ?? ""
  const statusFilter =
    (table.getColumn("status")?.getFilterValue() as string | undefined) ??
    filters.status[0].value
  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  function setColumnSelectFilter(columnId: string, value: string) {
    table
      .getColumn(columnId)
      ?.setFilterValue(value === "all" ? undefined : value)
    table.setPageIndex(0)
  }

  function getSortValue(sorting: SortingState) {
    const s = sorting[0]
    if (!s) return "requestedAt-desc"
    return `${s.id}-${s.desc ? "desc" : "asc"}`
  }

  function handleSortChange(value: string) {
    const [id, dir] = value.split("-") as [string, "asc" | "desc"]
    setSorting([{ id, desc: dir === "desc" }])
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium">Honor &amp; Payout</h1>
          <p className="text-sm text-muted-foreground">
            Kelola pengajuan pencairan honor kontributor.
          </p>
        </div>
        <div className="flex flex-wrap justify-start gap-2">
          {userRole !== "contributor" && (
            <Button variant="outline">
              <Download /> Ekspor
            </Button>
          )}
          {userRole === "contributor" && eligibleTotalHonor >= minPayout && (
            <RequestPayoutDialog
              onPayoutCreated={() => setRefreshKey((k) => k + 1)}
            />
          )}
        </div>
      </div>

      {userRole === "contributor" &&
        eligibleTotalHonor > 0 &&
        eligibleTotalHonor < minPayout && (
          <Alert variant="default">
            <AlertCircle className="size-4" />
            <AlertTitle>Minimum Payout Belum Terpenuhi</AlertTitle>
            <AlertDescription>
              Total honor artikel yang bisa diajukan sebesar{" "}
              <strong>Rp{eligibleTotalHonor.toLocaleString("id-ID")}</strong>,
              sedangkan minimum pengajuan adalah{" "}
              <strong>Rp{minPayout.toLocaleString("id-ID")}</strong>. Kumpulkan
              lebih banyak artikel yang disetujui untuk mengajukan pencairan.
            </AlertDescription>
          </Alert>
        )}

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 px-4">
          {selectedCount > 0 && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground tabular-nums">
                {selectedCount} dipilih
              </div>
            </div>
          )}
          <InputGroup className="w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              placeholder="Cari payout..."
              value={searchQuery}
              onChange={(event) => {
                table
                  .getColumn("search")
                  ?.setFilterValue(event.target.value || undefined)
                table.setPageIndex(0)
              }}
            />
            <InputGroupAddon align="inline-end">
              <Kbd className="h-4 text-[10px]">/</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <div className="grow" />
          <Select
            value={statusFilter}
            onValueChange={(value) => setColumnSelectFilter("status", value)}
          >
            <SelectTrigger>
              <span className="text-muted-foreground">Status:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectGroup>
                {filters.status.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={getSortValue(sorting)}
            onValueChange={handleSortChange}
          >
            <SelectTrigger>
              <ArrowDownWideNarrow className="size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectGroup>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <PayoutsTable table={table} />
        </CardContent>
      </Card>
    </div>
  )
}

"use client"
"use no memo"

import * as React from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { ArrowDownWideNarrow, Plus, Search } from "lucide-react"

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
import { articleColumns } from "./_components/articles-columns"
import { filters, type ArticleRow } from "./_components/article-data"
import { ArticlesTable } from "./_components/articles-table"
import { api } from "@/lib/eden-client"

function mapApiArticle(a: any): ArticleRow {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt ?? "",
    status: a.status,
    category: a.category?.name ?? "",
    author: {
      name: a.author?.name ?? "Unknown",
      avatar: a.author?.image ?? "",
    },
    reviewer: a.reviewer
      ? { name: a.reviewer.name, avatar: a.reviewer.image ?? "" }
      : null,
    wordCount: a.wordCount ?? 0,
    honor: a.honor ?? 0,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    publishedAt: a.publishedAt ?? null,
  }
}

export default function ArticlesPage() {
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const slug = params.slug
  const [articles, setArticles] = React.useState<ArticleRow[]>([])
  const [loading, setLoading] = React.useState(true)

  // Baca status dari query param ?status=
  const statusFromUrl = searchParams.get("status")

  React.useEffect(() => {
    setLoading(true)
    const query: Record<string, string> = { page: "1", pageSize: "100" }
    if (statusFromUrl) query.status = statusFromUrl
    api.api
      .orgs({ slug })
      .articles.get({ query: query as any })
      .then(({ data }) => {
        if (data?.success && Array.isArray(data.data)) {
          setArticles(data.data.map(mapApiArticle))
        }
      })
      .finally(() => setLoading(false))
  }, [slug, statusFromUrl])

  const [rowSelection, setRowSelection] = React.useState({})
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "updatedAt", desc: true },
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    statusFromUrl ? [{ id: "status", value: statusFromUrl }] : []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      search: false,
      select: false,
    })
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data: articles,
    columns: articleColumns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    enableRowSelection: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const articleSortOptions = [
    { value: "updatedAt-desc", label: "Terbaru" },
    { value: "updatedAt-asc", label: "Terlama" },
    { value: "title-asc", label: "Judul A-Z" },
    { value: "title-desc", label: "Judul Z-A" },
    { value: "honor-desc", label: "Honor Tertinggi" },
    { value: "honor-asc", label: "Honor Terendah" },
  ] as const

  function getSortValue(sorting: SortingState) {
    const s = sorting[0]
    if (!s) return "updatedAt-desc"
    return `${s.id}-${s.desc ? "desc" : "asc"}`
  }

  function handleSortChange(value: string) {
    const [id, dir] = value.split("-") as [string, "asc" | "desc"]
    setSorting([{ id, desc: dir === "desc" }])
  }

  // Debounced search: tunggu 300ms sebelum filter
  const [searchInput, setSearchInput] = React.useState("")
  React.useEffect(() => {
    const timer = setTimeout(() => {
      table.getColumn("search")?.setFilterValue(searchInput || undefined)
      table.setPageIndex(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, table])

  const searchQuery = searchInput
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

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium">Artikel</h1>
          <p className="text-sm text-muted-foreground">
            Kelola semua artikel dalam ruang kerja ini.
          </p>
        </div>
        <div className="flex flex-wrap justify-start gap-2">
          <Link href={`/orgs/${slug}/articles/new`}>
            <Button>
              <Plus /> Artikel Baru
            </Button>
          </Link>
        </div>
      </div>

      {!loading && articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <h2 className="text-lg font-medium">Belum ada artikel</h2>
            <p className="text-sm text-muted-foreground">
              Buat artikel pertama Anda untuk memulai.
            </p>
            <Link href={`/orgs/${slug}/articles/new`}>
              <Button>
                <Plus /> Buat Artikel Pertama
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3 px-4">
            <InputGroup className="w-full md:w-64">
              <InputGroupAddon align="inline-start">
                <Search className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                className="h-7"
                placeholder="Cari artikel..."
                value={searchQuery}
                onChange={(event) => setSearchInput(event.target.value)}
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
                  {filters.status.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                  {articleSortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <ArticlesTable table={table} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

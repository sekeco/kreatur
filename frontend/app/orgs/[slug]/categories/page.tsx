"use client"
"use no memo"

import * as React from "react"
import { useParams } from "next/navigation"

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import type { MouseEvent } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  ArrowDownWideNarrow,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Download,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import { api } from "@/lib/eden-client"
import { getErrorMessage } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  articleCount: number
  color: string
  createdAt: string | Date
}

// ─── Helpers ───────────────────────────────────────────

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

const COLOR_OPTIONS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
  "#22d3ee",
]

const sortOptions = [
  { value: "createdAt-desc", label: "Terbaru" },
  { value: "createdAt-asc", label: "Terlama" },
  { value: "name-asc", label: "Nama A-Z" },
  { value: "name-desc", label: "Nama Z-A" },
  { value: "articleCount-desc", label: "Artikel Terbanyak" },
  { value: "articleCount-asc", label: "Artikel Tersedikit" },
] as const

// ─── Page ──────────────────────────────────────────────

export default function CategoriesPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [categories, setCategories] = React.useState<Category[]>([])
  const [search, setSearch] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(
    null
  )
  const [deletingCategory, setDeletingCategory] =
    React.useState<Category | null>(null)
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ])
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  // Form state
  const [formName, setFormName] = React.useState("")
  const [formDescription, setFormDescription] = React.useState("")
  const [formColor, setFormColor] = React.useState(COLOR_OPTIONS[0])

  // Fetch categories
  const fetchCategories = React.useCallback(() => {
    setLoading(true)
    api.api
      .orgs({ slug })
      .categories.get({ query: { pageSize: "100" } })
      .then(({ data }) => {
        if (data?.success && Array.isArray(data.data)) {
          setCategories(data.data)
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const filteredCategories = React.useMemo(
    () =>
      categories.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.description ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [categories, search]
  )

  // ─── CRUD ─────────────────────────────────────────────

  function openCreateDialog() {
    setEditingCategory(null)
    setFormName("")
    setFormDescription("")
    setFormColor(COLOR_OPTIONS[0])
    setDialogOpen(true)
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category)
    setFormName(category.name)
    setFormDescription(category.description ?? "")
    setFormColor(category.color)
    setDialogOpen(true)
  }

  async function saveCategory() {
    if (!formName.trim()) {
      toast.error("Nama kategori harus diisi")
      return
    }

    setSaving(true)

    try {
      if (editingCategory) {
        const { error } = await api.api
          .orgs({ slug })
          .categories({ id: editingCategory.id })
          .put({
            name: formName.trim(),
            slug: slugify(formName.trim()),
            description: formDescription.trim() || undefined,
            color: formColor,
          })
        if (error) {
          toast.error(getErrorMessage(error) ?? "Gagal memperbarui kategori")
          setSaving(false)
          return
        }
        toast.success("Kategori berhasil diperbarui")
      } else {
        const { error } = await api.api.orgs({ slug }).categories.post({
          name: formName.trim(),
          slug: slugify(formName.trim()),
          description: formDescription.trim() || undefined,
          color: formColor,
        })
        if (error) {
          toast.error(getErrorMessage(error) ?? "Gagal menambahkan kategori")
          setSaving(false)
          return
        }
        toast.success("Kategori berhasil ditambahkan")
      }

      setDialogOpen(false)
      fetchCategories()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  function confirmDelete(category: Category) {
    setDeletingCategory(category)
    setDeleteDialogOpen(true)
  }

  async function executeDelete() {
    if (!deletingCategory) return
    setSaving(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .categories({ id: deletingCategory.id })
        .delete()
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal menghapus kategori")
        setSaving(false)
        return
      }
      toast.success(`Kategori "${deletingCategory.name}" berhasil dihapus`)
      setDeleteDialogOpen(false)
      setDeletingCategory(null)
      fetchCategories()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleImportFromWP() {
    toast.info("Mengimpor kategori dari WordPress...")
    try {
      const { data, error } = await api.api
        .orgs({ slug })
        .connections.wordpress["import-categories"].post()
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengimpor kategori")
        return
      }
      if (data?.success) {
        toast.success(data.data?.message ?? "Kategori berhasil diimpor")
        fetchCategories()
      } else {
        toast.error(data?.error ?? "Gagal mengimpor kategori")
      }
    } catch {
      toast.error("Gagal mengimpor kategori")
    }
  }

  // ─── Columns ──────────────────────────────────────────

  function handleSortChange(value: string) {
    const [id, dir] = value.split("-") as [string, "asc" | "desc"]
    setSorting([{ id, desc: dir === "desc" }])
  }

  const columns: ColumnDef<Category>[] = [
    {
      id: "color",
      cell: ({ row }) => (
        <span
          className="block size-4 rounded-full"
          style={{ backgroundColor: row.original.color }}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Nama",
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">
            {row.original.name}
          </div>
          <div className="text-xs text-muted-foreground">
            /{row.original.slug}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Deskripsi",
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-sm text-muted-foreground">
          {row.original.description ?? "—"}
        </div>
      ),
    },
    {
      accessorKey: "articleCount",
      header: "Artikel",
    },
    {
      id: "createdAt",
      header: "Dibuat",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), "d MMM yyyy", {
            locale: id,
          })}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Aksi untuk ${row.original.name}`}
                className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                size="icon-sm"
                variant="ghost"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditDialog(row.original)}>
                <Edit />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => confirmDelete(row.original)}
              >
                <Trash2 />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    },
  ]

  // ─── Table ────────────────────────────────────────────

  const table = useReactTable({
    data: filteredCategories,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const pageCount = Math.max(table.getPageCount(), 1)
  const currentPage = table.getState().pagination.pageIndex + 1
  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const currentSort = `${sorting[0]?.id ?? "createdAt"}-${sorting[0]?.desc ? "desc" : "asc"}`

  function getPageNumbers(current: number, total: number) {
    if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1)
    if (current <= 2) return [1, 2, 3]
    if (current >= total - 1) return [total - 2, total - 1, total]
    return [current - 1, current, current + 1]
  }

  function preventNav(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
  }

  // ─── Render ───────────────────────────────────────────

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium">Kategori</h1>
          <p className="text-sm text-muted-foreground">
            Kelola kategori artikel dalam ruang kerja ini.
          </p>
        </div>
        <div className="flex flex-wrap justify-start gap-2">
          <Button variant="outline" onClick={handleImportFromWP}>
            <Download /> Import dari WordPress
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus /> Kategori Baru
          </Button>
        </div>
      </div>

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
              placeholder="Cari kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <Kbd className="h-4 text-[10px]">/</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <div className="grow" />
          <Select value={currentSort} onValueChange={handleSortChange}>
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
          <div className="flex flex-1 flex-col">
            <div>
              <Table>
                <TableHeader className="[&_tr]:border-t">
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((h) => (
                        <TableHead key={h.id} className="px-3.5 font-semibold">
                          {h.isPlaceholder
                            ? null
                            : flexRender(
                                h.column.columnDef.header,
                                h.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="px-3.5 py-2.5 align-middle"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        {loading ? "Memuat..." : "Tidak ada kategori."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <Separator className="mb-4" />

            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Baris per halaman</span>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => table.setPageSize(Number(value))}
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-min"
                      id="categories-rows-per-page"
                    >
                      <SelectValue
                        placeholder={`${table.getState().pagination.pageSize}`}
                      />
                    </SelectTrigger>
                    <SelectContent side="top">
                      <SelectGroup>
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <span>
                  Halaman {currentPage} dari {pageCount}
                </span>
              </div>

              <Pagination className="mx-0 w-auto justify-start md:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      text="Sebelumnya"
                      className={
                        !table.getCanPreviousPage()
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                      onClick={(e) => {
                        preventNav(e)
                        table.previousPage()
                      }}
                    />
                  </PaginationItem>
                  {getPageNumbers(currentPage, pageCount)[0] > 1 ? (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : null}
                  {getPageNumbers(currentPage, pageCount).map((n) => (
                    <PaginationItem key={n}>
                      <PaginationLink
                        href="#"
                        isActive={
                          table.getState().pagination.pageIndex === n - 1
                        }
                        onClick={(e) => {
                          preventNav(e)
                          table.setPageIndex(n - 1)
                        }}
                      >
                        {n}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {getPageNumbers(currentPage, pageCount)[
                    getPageNumbers(currentPage, pageCount).length - 1
                  ] < pageCount ? (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : null}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      text="Berikutnya"
                      className={
                        !table.getCanNextPage()
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                      onClick={(e) => {
                        preventNav(e)
                        table.nextPage()
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Create / Edit Dialog ──────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Kategori" : "Kategori Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Ubah nama, deskripsi, atau warna kategori."
                : "Tambahkan kategori baru untuk mengelompokkan artikel."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Kategori</Label>
              <Input
                id="name"
                placeholder="Contoh: Teknologi"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Deskripsi</Label>
              <Textarea
                id="desc"
                placeholder="Deskripsi singkat tentang kategori ini"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>Warna</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`size-7 rounded-full border-2 transition-all ${
                      formColor === color
                        ? "scale-110 border-foreground"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                    aria-label={`Pilih warna ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={saveCategory} disabled={saving}>
              {saving ? "Menyimpan..." : editingCategory ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Kategori</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori{" "}
              <span className="font-medium text-foreground">
                {deletingCategory?.name}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
              {deletingCategory && deletingCategory.articleCount > 0 && (
                <span className="mt-2 block text-destructive">
                  Kategori ini memiliki {deletingCategory.articleCount} artikel
                  yang terkait.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={executeDelete}
              disabled={saving}
            >
              {saving ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

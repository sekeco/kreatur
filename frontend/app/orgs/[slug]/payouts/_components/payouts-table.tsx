"use client"
"use no memo"

import * as React from "react"
import { useParams } from "next/navigation"
import type { MouseEvent } from "react"

import type { ColumnDef, Row } from "@tanstack/react-table"
import { flexRender, type Table as TableType } from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import {
  Banknote,
  Check,
  CreditCard,
  Eye,
  MoreHorizontal,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/eden-client"
import { getErrorMessage } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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
import { cn } from "@/lib/utils"

import type { PayoutRow } from "./data"
import { formatCurrency, statusMeta } from "./data"

// ─── Helpers ───────────────────────────────────────────

function preventNav(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()
}

function getPageNumbers(currentPage: number, pageCount: number) {
  if (pageCount <= 3) return Array.from({ length: pageCount }, (_, i) => i + 1)
  if (currentPage <= 2) return [1, 2, 3]
  if (currentPage >= pageCount - 1)
    return [pageCount - 2, pageCount - 1, pageCount]
  return [currentPage - 1, currentPage, currentPage + 1]
}

// ─── Status Badge ──────────────────────────────────────

function StatusBadge({ status }: { status: PayoutRow["status"] }) {
  const meta = statusMeta[status]
  return (
    <Badge
      className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)}
      variant="outline"
    >
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {meta.label}
    </Badge>
  )
}

// ─── Actions Cell ──────────────────────────────────────

function PayoutActionsCell({
  row,
  table,
}: {
  row: Row<PayoutRow>
  table: TableType<PayoutRow>
}) {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const payout = row.original

  // Only owner and finance roles can perform actions on payouts
  const userRole = (table.options.meta as any)?.userRole
  const canManage = userRole === "owner" || userRole === "finance"
  const isContributor = userRole === "contributor"
  const refreshPayouts = (table.options.meta as any)?.refreshPayouts

  const [confirmAction, setConfirmAction] = React.useState<
    "approve" | "reject" | "process" | "complete" | "cancel" | null
  >(null)
  const [reviewNotes, setReviewNotes] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  async function executeAction() {
    if (!confirmAction) return
    setBusy(true)
    try {
      let status = ""
      switch (confirmAction) {
        case "approve":
          status = "APPROVED"
          break
        case "reject":
          status = "REJECTED"
          break
        case "process":
          status = "PROCESSING"
          break
        case "complete":
          status = "COMPLETED"
          break
      }

      if (confirmAction === "cancel") {
        const { error } = await api.api
          .orgs({ slug })
          .payouts({ id: payout.id })
          .cancel.post({ reason: reviewNotes || "Tidak ada alasan" })

        if (error) {
          toast.error(getErrorMessage(error) ?? "Gagal membatalkan payout")
        } else {
          toast.success("Payout berhasil dibatalkan!")
          refreshPayouts?.()
        }
      } else {
        const { error } = await api.api
          .orgs({ slug })
          .payouts({ id: payout.id })
          .status.put({
            status,
            reviewNotes: reviewNotes || undefined,
          })

        if (error) {
          toast.error(getErrorMessage(error) ?? "Gagal memproses payout")
        } else {
          toast.success("Status payout berhasil diperbarui!")
          refreshPayouts?.()
        }
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setBusy(false)
      setConfirmAction(null)
      setReviewNotes("")
    }
  }

  const dialogTitle =
    confirmAction === "approve"
      ? "Setujui Payout"
      : confirmAction === "reject"
        ? "Tolak Payout"
        : confirmAction === "process"
          ? "Proses Payout"
          : confirmAction === "complete"
            ? "Selesaikan Payout"
            : "Batalkan Payout"

  const dialogDescription =
    confirmAction === "approve"
      ? `Setujui pengajuan payout ${payout.id} sebesar ${formatCurrency(payout.totalAmount)}?`
      : confirmAction === "reject"
        ? `Tolak pengajuan payout ${payout.id}?`
        : confirmAction === "process"
          ? `Tandai payout ${payout.id} sebagai sedang diproses?`
          : confirmAction === "complete"
            ? `Selesaikan payout ${payout.id} dan tandai sebagai已完成?`
            : `Batalkan pengajuan payout ${payout.id}?`

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {canManage && payout.status === "PENDING" && (
          <Button size="sm" onClick={() => setConfirmAction("approve")}>
            <Check className="mr-1 size-3.5" /> Setujui
          </Button>
        )}
        {isContributor && payout.status === "PENDING" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmAction("cancel")}
          >
            <X className="mr-1 size-3.5" /> Batalkan
          </Button>
        )}
        {canManage && payout.status === "APPROVED" && (
          <Button size="sm" onClick={() => setConfirmAction("process")}>
            <CreditCard className="mr-1 size-3.5" /> Proses
          </Button>
        )}
        {canManage && payout.status === "PROCESSING" && (
          <Button size="sm" onClick={() => setConfirmAction("complete")}>
            <CreditCard className="mr-1 size-3.5" /> Selesaikan
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Aksi untuk ${payout.id}`}
              className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
              size="icon-sm"
              variant="ghost"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => row.toggleExpanded()}>
              <Eye /> Detail
            </DropdownMenuItem>
            {canManage && payout.status === "PENDING" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirmAction("reject")}
                >
                  <X /> Tolak
                </DropdownMenuItem>
              </>
            )}
            {canManage && payout.status === "COMPLETED" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Banknote /> Bukti Transfer
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={() => !busy && setConfirmAction(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          {(confirmAction === "approve" ||
            confirmAction === "reject" ||
            confirmAction === "cancel") && (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="review-notes">
                  {confirmAction === "cancel"
                    ? "Alasan Pembatalan"
                    : "Catatan (opsional)"}
                </FieldLabel>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    confirmAction === "cancel"
                      ? "Tulis alasan pembatalan..."
                      : "Tambahkan catatan..."
                  }
                />
              </Field>
            </FieldGroup>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={busy}
            >
              Batal
            </Button>
            <Button
              variant={
                confirmAction === "reject" || confirmAction === "cancel"
                  ? "destructive"
                  : "default"
              }
              onClick={executeAction}
              disabled={busy}
            >
              {busy
                ? "Memproses..."
                : confirmAction === "approve"
                  ? "Setujui"
                  : confirmAction === "reject"
                    ? "Tolak"
                    : confirmAction === "process"
                      ? "Proses"
                      : confirmAction === "complete"
                        ? "Selesaikan"
                        : "Batalkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Expanded Detail Row ───────────────────────────────

function PayoutDetailRow({ row }: { row: Row<PayoutRow> }) {
  const payout = row.original

  return (
    <div className="mx-3 mb-3 rounded-lg border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium">Daftar Artikel</h4>
        <span className="text-sm text-muted-foreground">
          {payout.totalArticles} artikel &middot; total{" "}
          {formatCurrency(payout.totalAmount)}
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-3">Judul Artikel</TableHead>
              <TableHead className="w-28 px-3 text-right">Honor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payout.articles.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="px-3 text-sm">{article.title}</TableCell>
                <TableCell className="px-3 text-right text-sm font-medium tabular-nums">
                  {formatCurrency(article.amount)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell className="px-3">Total</TableCell>
              <TableCell className="px-3 text-right tabular-nums">
                {formatCurrency(payout.totalAmount)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ─── Column Definitions ────────────────────────────────

export const payoutColumns: ColumnDef<PayoutRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Pilih semua"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label={`Pilih ${row.original.id}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: "search",
    accessorFn: (row) => `${row.id} ${row.contributor}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "id",
    header: "Kode",
    cell: ({ row }) => (
      <div className="text-sm font-medium">{row.original.id}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "contributor",
    header: "Kontributor",
    cell: ({ row }) => (
      <div className="text-sm font-medium">{row.original.contributor}</div>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: "Nominal",
    cell: ({ row }) => (
      <div className="text-sm font-medium tabular-nums">
        {formatCurrency(row.original.totalAmount)}
      </div>
    ),
  },
  {
    accessorKey: "totalArticles",
    header: "Artikel",
    cell: ({ row }) => (
      <div className="text-sm tabular-nums">{row.original.totalArticles}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "requestedAt",
    accessorFn: (row) => parseISO(row.requestedAt).getTime(),
    header: "Tanggal",
    cell: ({ row }) => (
      <div className="text-sm text-foreground">
        {format(parseISO(row.original.requestedAt), "d MMM yyyy", {
          locale: id,
        })}
      </div>
    ),
    sortingFn: "datetime",
  },
  {
    id: "bankInfo",
    header: "Bank",
    cell: ({ row }) => (
      <div className="text-sm">
        <div>{row.original.bankName}</div>
        <div className="text-xs text-muted-foreground">
          {row.original.bankAccountNumber}
        </div>
      </div>
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row, table }) => (
      <PayoutActionsCell row={row} table={table as TableType<PayoutRow>} />
    ),
    enableHiding: false,
    enableSorting: false,
  },
]

// ─── Table Component ───────────────────────────────────

export function PayoutsTable({ table }: { table: TableType<PayoutRow> }) {
  const pageCount = Math.max(table.getPageCount(), 1)
  const currentPage = Math.min(
    table.getState().pagination.pageIndex + 1,
    pageCount
  )
  const pageNumbers = getPageNumbers(currentPage, pageCount)

  return (
    <div className="flex flex-1 flex-col">
      <div>
        <Table>
          <TableHeader className="[&_tr]:border-t">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-3.5 font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-3 py-2.5 align-middle"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow key={`${row.id}-expanded`}>
                      <TableCell
                        colSpan={row.getVisibleCells().length}
                        className="p-0"
                      >
                        <PayoutDetailRow row={row} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-24 text-center"
                >
                  Tidak ada pengajuan pencairan.
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
                id="payouts-rows-per-page"
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
                onClick={(event) => {
                  preventNav(event)
                  table.previousPage()
                }}
              />
            </PaginationItem>
            {pageNumbers[0] > 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {pageNumbers.map((pn) => (
              <PaginationItem key={`page-${pn}`}>
                <PaginationLink
                  href="#"
                  isActive={table.getState().pagination.pageIndex === pn - 1}
                  onClick={(event) => {
                    preventNav(event)
                    table.setPageIndex(pn - 1)
                  }}
                >
                  {pn}
                </PaginationLink>
              </PaginationItem>
            ))}
            {pageNumbers[pageNumbers.length - 1] < pageCount && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                text="Berikutnya"
                className={
                  !table.getCanNextPage()
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
                onClick={(event) => {
                  preventNav(event)
                  table.nextPage()
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

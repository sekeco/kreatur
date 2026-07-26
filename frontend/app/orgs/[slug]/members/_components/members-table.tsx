"use client"
"use no memo"

import * as React from "react"
import { useParams } from "next/navigation"
import type { MouseEvent } from "react"

import type { ColumnDef, Row } from "@tanstack/react-table"
import { flexRender, type Table as TableType } from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { Ban, MoreHorizontal, Pencil, UserCheck } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
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
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn, getInitials } from "@/lib/utils"

import type { MemberRow } from "./data"
import { formatCurrency, roleMeta, statusMeta } from "./data"

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

// ─── Shared Cells ──────────────────────────────────────

function StatusBadge({ status }: { status: MemberRow["status"] }) {
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

function RoleBadge({ role }: { role: MemberRow["role"] }) {
  const meta = roleMeta[role]
  if (!meta) {
    return <span className="text-sm">{role}</span>
  }
  return (
    <Badge
      className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)}
      variant="outline"
    >
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {role}
    </Badge>
  )
}

function AvatarCell({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-7">
        <AvatarFallback className="text-[10px]">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{name}</span>
    </div>
  )
}

// ─── Actions Cell ──────────────────────────────────────

function ActionsCell({ row }: { row: Row<MemberRow> }) {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const member = row.original

  const [confirmRemove, setConfirmRemove] = React.useState(false)
  const [roleDialog, setRoleDialog] = React.useState(false)
  const [newRoleValue, setNewRoleValue] = React.useState(member.role)
  const [busy, setBusy] = React.useState(false)

  async function handleRemove() {
    setBusy(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .members({ memberId: member.id })
        .delete()
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengeluarkan anggota")
      } else {
        toast.success(`${member.name} berhasil dikeluarkan`)
        setConfirmRemove(false)
        window.location.reload()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setBusy(false)
    }
  }

  async function handleRoleChange() {
    setBusy(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .members({ memberId: member.id })
        .role.put({ role: newRoleValue })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengubah role")
      } else {
        toast.success(`Role ${member.name} berhasil diubah`)
        setRoleDialog(false)
        window.location.reload()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Aksi untuk ${member.name}`}
              className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
              size="icon-sm"
              variant="ghost"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setConfirmRemove(true)}
              variant="destructive"
            >
              <Ban className="size-4" />
              Keluarkan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setNewRoleValue(member.role)
                setRoleDialog(true)
              }}
            >
              <Pencil className="size-4" />
              Ubah Role
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Remove Dialog */}
      <Dialog
        open={confirmRemove}
        onOpenChange={() => !busy && setConfirmRemove(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keluarkan Anggota</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengeluarkan{" "}
              <strong>{member.name}</strong> dari ruang kerja?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRemove(false)}
              disabled={busy}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={busy}
            >
              {busy ? "Memproses..." : "Keluarkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog
        open={roleDialog}
        onOpenChange={() => !busy && setRoleDialog(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Role</DialogTitle>
            <DialogDescription>
              Ubah peran <strong>{member.name}</strong> dalam ruang kerja.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`role-${member.id}`}>Role Baru</FieldLabel>
              <Select value={newRoleValue} onValueChange={setNewRoleValue}>
                <SelectTrigger id={`role-${member.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="contributor">Kontributor</SelectItem>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialog(false)}
              disabled={busy}
            >
              Batal
            </Button>
            <Button onClick={handleRoleChange} disabled={busy}>
              {busy ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Column Definitions ────────────────────────────────

export function buildContributorColumns(): ColumnDef<MemberRow>[] {
  return [
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
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label={`Pilih ${row.original.name}`}
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
      accessorFn: (row) => `${row.name} ${row.email}`,
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      accessorKey: "name",
      header: "Nama",
      cell: ({ row }) => <AvatarCell name={row.original.name} />,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.email}
        </div>
      ),
    },
    {
      accessorKey: "articleCount",
      header: "Artikel",
      cell: ({ row }) => (
        <div className="text-sm tabular-nums">{row.original.articleCount}</div>
      ),
    },
    {
      id: "defaultHonor",
      accessorKey: "defaultHonor",
      header: "Honor Default",
      cell: ({ row }) => (
        <div className="text-sm font-medium tabular-nums">
          {formatCurrency(row.original.defaultHonor ?? 0)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "joinedAt",
      accessorFn: (row) => parseISO(row.joinedAt).getTime(),
      header: "Bergabung",
      cell: ({ row }) => (
        <div className="text-sm text-foreground">
          {format(parseISO(row.original.joinedAt), "d MMM yyyy", {
            locale: id,
          })}
        </div>
      ),
      sortingFn: "datetime",
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => <ActionsCell row={row} />,
      enableHiding: false,
      enableSorting: false,
    },
  ]
}

export function buildStaffColumns(): ColumnDef<MemberRow>[] {
  return [
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
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            aria-label={`Pilih ${row.original.name}`}
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
      accessorFn: (row) => `${row.name} ${row.email}`,
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      accessorKey: "name",
      header: "Nama",
      cell: ({ row }) => <AvatarCell name={row.original.name} />,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.email}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      filterFn: "equalsString",
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "joinedAt",
      accessorFn: (row) => parseISO(row.joinedAt).getTime(),
      header: "Bergabung",
      cell: ({ row }) => (
        <div className="text-sm text-foreground">
          {format(parseISO(row.original.joinedAt), "d MMM yyyy", {
            locale: id,
          })}
        </div>
      ),
      sortingFn: "datetime",
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => <ActionsCell row={row} />,
      enableHiding: false,
      enableSorting: false,
    },
  ]
}

// ─── Table Component ───────────────────────────────────

export function MembersTable({ table }: { table: TableType<MemberRow> }) {
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-24 text-center"
                >
                  Tidak ada anggota.
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
                id="members-rows-per-page"
              >
                <SelectValue
                  placeholder={`${table.getState().pagination.pageSize}`}
                />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[5, 10, 20, 30, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
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

"use client"
"use no memo"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"

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
import { ArrowDownWideNarrow, Plus, Search, UserPlus } from "lucide-react"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/eden-client"
import { getErrorMessage } from "@/lib/utils"
import {
  buildContributorColumns,
  buildStaffColumns,
  MembersTable,
} from "./_components/members-table"
import {
  filters,
  sortOptions,
  staffSortOptions,
  type MemberRow,
} from "./_components/data"

function mapApiMember(m: any): MemberRow {
  const rawRole = (m.role ?? "member").toLowerCase()
  const role = rawRole === "member" ? "contributor" : rawRole
  const isContributor = role === "contributor"
  return {
    id: m.user?.id ?? m.userId ?? m.id,
    name: m.user?.name ?? "Unknown",
    email: m.user?.email ?? "",
    // capitalize first letter for roleMeta lookup
    role: role.charAt(0).toUpperCase() + role.slice(1),
    type: isContributor ? "contributor" : "staff",
    status: "active",
    articleCount: 0, // ponytail: not tracked by Better Auth
    defaultHonor: undefined,
    joinedAt: m.createdAt,
  }
}

// ─── Shared Table Hook ─────────────────────────────────

function useMemberTable(
  data: MemberRow[],
  columns: ReturnType<typeof buildContributorColumns>,
  sorting: SortingState,
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>
) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ search: false })
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  return useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    enableRowSelection: true,
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
}

// ─── Member Section ────────────────────────────────────

function MemberSection({
  data,
  columns,
  sortOpts,
  placeholder,
  onInvite,
  onRemove,
  onRoleChange,
}: {
  data: MemberRow[]
  columns: ReturnType<typeof buildContributorColumns>
  sortOpts: readonly { value: string; label: string }[]
  placeholder: string
  onInvite: () => void
  onRemove: (member: MemberRow) => void
  onRoleChange: (member: MemberRow, newRole: string) => void
}) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "joinedAt", desc: true },
  ])
  const table = useMemberTable(data, columns, sorting, setSorting)

  const searchQuery =
    (table.getColumn("search")?.getFilterValue() as string | undefined) ?? ""
  const statusFilter =
    (table.getColumn("status")?.getFilterValue() as string | undefined) ??
    filters.status[0].value
  const selectedCount = table.getFilteredSelectedRowModel().rows.length

  // Pass callbacks via table meta
  React.useEffect(() => {
    table.options.meta = { onRemove, onRoleChange } as any
  })

  function setColumnSelectFilter(columnId: string, value: string) {
    table
      .getColumn(columnId)
      ?.setFilterValue(value === "all" ? undefined : value)
    table.setPageIndex(0)
  }

  function getSortValue(sorting: SortingState) {
    const s = sorting[0]
    if (!s) return "joinedAt-desc"
    return `${s.id}-${s.desc ? "desc" : "asc"}`
  }

  function handleSortChange(value: string) {
    const [id, dir] = value.split("-") as [string, "asc" | "desc"]
    setSorting([{ id, desc: dir === "desc" }])
  }

  return (
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
            placeholder={placeholder}
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
        <Select value={getSortValue(sorting)} onValueChange={handleSortChange}>
          <SelectTrigger>
            <ArrowDownWideNarrow className="size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectGroup>
              {sortOpts.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        <MembersTable table={table} />
      </CardContent>
    </Card>
  )
}

// ─── Page ──────────────────────────────────────────────

export default function MembersPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params.slug

  const [members, setMembers] = React.useState<MemberRow[]>([])
  const [loading, setLoading] = React.useState(true)

  // Invite dialog
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState("contributor")
  const [inviting, setInviting] = React.useState(false)

  // Remove dialog
  const [removing, setRemoving] = React.useState<MemberRow | null>(null)
  const [removingBusy, setRemovingBusy] = React.useState(false)

  // Role change dialog
  const [changingRole, setChangingRole] = React.useState<MemberRow | null>(null)
  const [newRole, setNewRole] = React.useState("")
  const [changingRoleBusy, setChangingRoleBusy] = React.useState(false)

  const fetchMembers = React.useCallback(() => {
    if (!slug) return
    setLoading(true)
    api.api
      .orgs({ slug })
      .members.get()
      .then(({ data }) => {
        if (data?.success && Array.isArray(data.data)) {
          setMembers(data.data.map(mapApiMember))
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  React.useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const contributors = members.filter((m) => m.type === "contributor")
  const staffMembers = members.filter((m) => m.type === "staff")

  // ── Invite ──
  async function handleInvite() {
    if (!inviteEmail) return
    setInviting(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .members.invite.post({ email: inviteEmail, role: inviteRole })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengundang anggota")
      } else {
        toast.success("Undangan berhasil dikirim!")
        setInviteOpen(false)
        setInviteEmail("")
        setInviteRole("contributor")
        fetchMembers()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setInviting(false)
    }
  }

  // ── Remove ──
  async function handleRemove() {
    if (!removing) return
    setRemovingBusy(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .members({ memberId: removing.id })
        .delete()
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengeluarkan anggota")
      } else {
        toast.success("Anggota berhasil dikeluarkan")
        setRemoving(null)
        fetchMembers()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setRemovingBusy(false)
    }
  }

  // ── Role Change ──
  async function handleRoleChange() {
    if (!changingRole || !newRole) return
    setChangingRoleBusy(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .members({ memberId: changingRole.id })
        .role.put({ role: newRole })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengubah role")
      } else {
        toast.success("Role berhasil diubah!")
        setChangingRole(null)
        fetchMembers()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setChangingRoleBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="@container/main flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-sm text-muted-foreground">Memuat anggota...</p>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium">Anggota</h1>
          <p className="text-sm text-muted-foreground">
            Kelola anggota dan kontributor dalam ruang kerja.
          </p>
        </div>
        <div className="flex flex-wrap justify-start gap-2">
          <Button variant="outline" onClick={() => setInviteOpen(true)}>
            <UserPlus /> Undang Anggota
          </Button>
        </div>
      </div>

      <Tabs defaultValue="contributors">
        <TabsList>
          <TabsTrigger value="contributors" className="gap-1.5">
            Kontributor
            <span className="text-xs text-muted-foreground">
              {contributors.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-1.5">
            Admin &amp; Staf
            <span className="text-xs text-muted-foreground">
              {staffMembers.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contributors" className="mt-4">
          <MemberSection
            data={contributors}
            columns={buildContributorColumns()}
            sortOpts={sortOptions}
            placeholder="Cari kontributor..."
            onInvite={() => setInviteOpen(true)}
            onRemove={(m) => setRemoving(m)}
            onRoleChange={(m, r) => {
              setChangingRole(m)
              setNewRole(r)
            }}
          />
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <MemberSection
            data={staffMembers}
            columns={buildStaffColumns()}
            sortOpts={staffSortOptions}
            placeholder="Cari anggota..."
            onInvite={() => setInviteOpen(true)}
            onRemove={(m) => setRemoving(m)}
            onRoleChange={(m, r) => {
              setChangingRole(m)
              setNewRole(r)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* ── Invite Dialog ── */}
      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          if (!inviting) setInviteOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Undang Anggota Baru</DialogTitle>
            <DialogDescription>
              Kirim undangan melalui email. Anggota akan menerima email untuk
              bergabung ke ruang kerja ini.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="invite-email">Alamat Email</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                placeholder="email@contoh.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-role">Peran (Role)</FieldLabel>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role">
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
              onClick={() => setInviteOpen(false)}
              disabled={inviting}
            >
              Batal
            </Button>
            <Button onClick={handleInvite} disabled={!inviteEmail || inviting}>
              {inviting ? "Mengirim..." : "Kirim Undangan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove Dialog ── */}
      <Dialog
        open={removing !== null}
        onOpenChange={() => !removingBusy && setRemoving(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keluarkan Anggota</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengeluarkan{" "}
              <strong>{removing?.name}</strong> dari ruang kerja?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoving(null)}
              disabled={removingBusy}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removingBusy}
            >
              {removingBusy ? "Memproses..." : "Keluarkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Role Change Dialog ── */}
      <Dialog
        open={changingRole !== null}
        onOpenChange={() => !changingRoleBusy && setChangingRole(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Role</DialogTitle>
            <DialogDescription>
              Ubah peran <strong>{changingRole?.name}</strong> dalam ruang
              kerja.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-role">Role Baru</FieldLabel>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="new-role">
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
              onClick={() => setChangingRole(null)}
              disabled={changingRoleBusy}
            >
              Batal
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={!newRole || changingRoleBusy}
            >
              {changingRoleBusy ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

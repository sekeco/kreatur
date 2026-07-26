"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import {
  Globe,
  Link,
  Plus,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/eden-client"
import { getErrorMessage } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────

interface Connection {
  id: string
  type: string
  config: string | null
  status: string | null
  lastSyncAt: string | null
  createdAt: string
}

interface WpConfig {
  siteUrl: string
  username: string
  appPassword: string
}

function parseConfig(config: string | null): WpConfig | null {
  if (!config) return null
  try {
    const parsed = JSON.parse(config)
    if (parsed.siteUrl) return parsed
    return null
  } catch {
    return null
  }
}

// ── Connect Form Dialog ──
// ─── Connect Form Dialog ───────────────────────────────

function ConnectFormDialog({
  open,
  onOpenChange,
  onSuccess,
  editing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editing?: Connection | null
}) {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const existingConfig = editing ? parseConfig(editing.config) : null

  const [siteUrl, setSiteUrl] = React.useState(existingConfig?.siteUrl ?? "")
  const [username, setUsername] = React.useState(existingConfig?.username ?? "")
  const [appPassword, setAppPassword] = React.useState("")
  const [testing, setTesting] = React.useState(false)
  const [testResult, setTestResult] = React.useState<{
    success: boolean
    message: string
  } | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setSiteUrl(existingConfig?.siteUrl ?? "")
      setUsername(existingConfig?.username ?? "")
      setAppPassword("")
      setTestResult(null)
    }
  }, [open, editing])

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const { data, error } = await api.api.connections.wordpress.test.post({
        siteUrl,
        username,
        appPassword,
      })
      if (error) {
        setTestResult({
          success: false,
          message: getErrorMessage(error) ?? "Gagal test koneksi",
        })
      } else {
        setTestResult({
          success: data?.success ?? false,
          message: data?.message ?? "Unknown",
        })
      }
    } catch {
      setTestResult({
        success: false,
        message: "Tidak dapat terhubung ke server",
      })
    } finally {
      setTesting(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const config = JSON.stringify({ siteUrl, username, appPassword })
      if (editing) {
        const { error } = await api.api
          .orgs({ slug })
          .connections({ id: editing.id })
          .put({ config: JSON.parse(config), status: "connected" })
        if (error) {
          toast.error(getErrorMessage(error) ?? "Gagal memperbarui koneksi")
          return
        }
      } else {
        const { error } = await api.api.orgs({ slug }).connections.post({
          type: "wordpress",
          config: JSON.parse(config),
          status: "connected",
        })
        if (error) {
          toast.error(getErrorMessage(error) ?? "Gagal menyimpan koneksi")
          return
        }
      }
      toast.success(
        editing
          ? "Koneksi berhasil diperbarui!"
          : "Koneksi berhasil ditambahkan!"
      )
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!saving && !testing) onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Koneksi WordPress" : "Tambah Koneksi WordPress"}
          </DialogTitle>
          <DialogDescription>
            Masukkan informasi koneksi WordPress Anda menggunakan Application
            Password.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="wp-url">URL Situs WordPress</FieldLabel>
            <Input
              id="wp-url"
              type="url"
              placeholder="https://contoh.com"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="wp-username">Username WordPress</FieldLabel>
            <Input
              id="wp-username"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="wp-password">
              Application Password
              {editing && (
                <span className="ml-1 text-xs text-muted-foreground">
                  (kosongkan jika tidak diubah)
                </span>
              )}
            </FieldLabel>
            <Input
              id="wp-password"
              type="password"
              placeholder={
                editing ? "••••••••" : "xxxx xxxx xxxx xxxx xxxx xxxx"
              }
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
            />
          </Field>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={!siteUrl || !username || !appPassword || testing}
            >
              {testing ? <Spinner /> : <Wifi />}
              Test Koneksi
            </Button>
            {testResult && (
              <Badge
                variant={testResult.success ? "default" : "destructive"}
                className="gap-1"
              >
                {testResult.success ? (
                  <Wifi className="size-3" />
                ) : (
                  <WifiOff className="size-3" />
                )}
                {testResult.message}
              </Badge>
            )}
          </div>
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Batal
          </Button>
          <Button onClick={handleSave} disabled={!siteUrl || saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Connection Card ────────────────────────────────────

function ConnectionCard({
  connection,
  onDelete,
  onEdit,
  onImportCategories,
  onSyncUsers,
}: {
  connection: Connection
  onDelete: (conn: Connection) => void
  onEdit: (conn: Connection) => void
  onImportCategories: (conn: Connection) => void
  onSyncUsers: (conn: Connection) => void
}) {
  const config = parseConfig(connection.config)
  const isConnected = connection.status === "connected"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
              <Globe className="size-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">
                {config?.siteUrl ?? "WordPress"}
              </CardTitle>
              <CardDescription>{config?.username ?? "—"}</CardDescription>
            </div>
          </div>
          <Badge
            variant={isConnected ? "default" : "outline"}
            className="shrink-0 gap-1"
          >
            {isConnected ? (
              <Wifi className="size-3" />
            ) : (
              <WifiOff className="size-3" />
            )}
            {isConnected ? "Terhubung" : "Terputus"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Tipe</span>
            <p className="font-medium capitalize">{connection.type}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Terakhir Sync</span>
            <p className="font-medium">
              {connection.lastSyncAt
                ? new Date(connection.lastSyncAt).toLocaleDateString("id-ID")
                : "—"}
            </p>
          </div>
        </div>

        <Separator className="mb-4" />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(connection)}
          >
            <Link className="size-3.5" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onImportCategories(connection)}
            disabled={!isConnected}
          >
            <RefreshCw className="size-3.5" /> Import Kategori
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSyncUsers(connection)}
            disabled={!isConnected}
          >
            <RefreshCw className="size-3.5" /> Sync Users
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="ml-auto"
            onClick={() => onDelete(connection)}
          >
            <Trash2 className="size-3.5" /> Hapus
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ───────────────────────────────────────────────

export default function ConnectionsPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [connections, setConnections] = React.useState<Connection[]>([])
  const [loading, setLoading] = React.useState(true)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Connection | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<Connection | null>(
    null
  )
  const [deleting, setDeleting] = React.useState(false)
  const [importing, setImporting] = React.useState<string | null>(null)
  const [syncing, setSyncing] = React.useState<string | null>(null)

  const fetchConnections = React.useCallback(() => {
    if (!slug) return
    setLoading(true)
    api.api
      .orgs({ slug })
      .connections.get({ query: { type: "wordpress", pageSize: "50" } })
      .then(({ data }) => {
        if (data?.success && Array.isArray(data.data)) {
          setConnections(data.data as unknown as Connection[])
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  React.useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  function handleAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function handleEdit(conn: Connection) {
    setEditing(conn)
    setFormOpen(true)
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .connections({ id: deleteConfirm.id })
        .delete()
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal menghapus koneksi")
      } else {
        toast.success("Koneksi berhasil dihapus")
        setDeleteConfirm(null)
        fetchConnections()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setDeleting(false)
    }
  }

  async function handleImportCategories(conn: Connection) {
    setImporting(conn.id)
    try {
      const { data, error } = await api.api
        .orgs({ slug })
        .connections.wordpress["import-categories"].post()
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengimpor kategori")
      } else if (data && "message" in data) {
        toast.success((data as any).message ?? "Kategori berhasil diimpor!")
        fetchConnections()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setImporting(null)
    }
  }

  async function handleSyncUsers(conn: Connection) {
    setSyncing(conn.id)
    try {
      const { data, error } = await api.api
        .orgs({ slug })
        .connections({ id: conn.id })
        ["sync-users"].post()
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal menyinkronkan user")
      } else if (data && "message" in data) {
        toast.success((data as any).message ?? "User berhasil disinkronkan!")
        fetchConnections()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium">Koneksi WordPress</h1>
          <p className="text-sm text-muted-foreground">
            Hubungkan ruang kerja Anda dengan WordPress untuk publikasi satu
            klik dan sinkronisasi data.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus /> Tambah Koneksi
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Globe className="size-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Belum ada koneksi WordPress</p>
              <p className="text-sm text-muted-foreground">
                Tambah koneksi untuk mulai mempublikasikan artikel ke WordPress.
              </p>
            </div>
            <Button onClick={handleAdd}>
              <Plus /> Tambah Koneksi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              onEdit={handleEdit}
              onDelete={(c) => setDeleteConfirm(c)}
              onImportCategories={(c) => handleImportCategories(c)}
              onSyncUsers={(c) => handleSyncUsers(c)}
            />
          ))}
        </div>
      )}

      {/* ── Connect Form Dialog ── */}
      <ConnectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchConnections}
        editing={editing}
      />

      {/* ── Delete Confirmation ── */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={() => !deleting && setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Koneksi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus koneksi ke{" "}
              <strong>
                {deleteConfirm
                  ? parseConfig(deleteConfirm.config)?.siteUrl
                  : ""}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

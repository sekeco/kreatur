"use client"

import * as React from "react"
import { Key, RotateCcw } from "lucide-react"
import { toast } from "sonner"

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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/eden-client"
import { getErrorMessage } from "@/lib/utils"
import type { ProfileData } from "./types"

interface Props {
  data: ProfileData
  slug: string
  onUpdated: () => void
}

export function SecuritySection({ data, slug, onUpdated }: Props) {
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false)
  const [resetSending, setResetSending] = React.useState(false)

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      toast.error("Password minimal 8 karakter")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok")
      return
    }
    setSaving(true)
    try {
      const { error } = await api.api.orgs({ slug }).profile.password.put({
        currentPassword,
        newPassword,
      })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengubah password")
      } else {
        toast.success("Password berhasil diubah!")
        setPasswordDialogOpen(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPassword() {
    setResetSending(true)
    try {
      const { error } = await authClient.requestPasswordReset({
        email: data.user.email,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) {
        toast.error(
          getErrorMessage(error) ?? "Gagal mengirim email reset password"
        )
      } else {
        toast.success(
          "Email reset password telah dikirim! Silakan cek inbox Anda."
        )
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setResetSending(false)
    }
  }

  async function handleUnlink(providerId: string) {
    try {
      const { error } = await api.api
        .orgs({ slug })
        .profile.accounts({ id: providerId })
        .delete()
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal memutuskan akun")
      } else {
        toast.success("Akun berhasil diputuskan!")
        onUpdated()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    }
  }

  const connectedAccounts = data.accounts.filter(
    (a) => a.provider !== "credential"
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keamanan</CardTitle>
        <CardDescription>Kelola password dan akun terhubung.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <h3 className="mb-2 text-sm font-medium">Password</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            {data.hasPassword
              ? "Anda memiliki password untuk masuk."
              : "Anda belum memiliki password. Tambahkan password untuk login via email."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Dialog
              open={passwordDialogOpen}
              onOpenChange={setPasswordDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Key data-icon="inline-start" />
                  {data.hasPassword ? "Ubah Password" : "Buat Password"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {data.hasPassword ? "Ubah Password" : "Buat Password"}
                  </DialogTitle>
                  <DialogDescription>
                    {data.hasPassword
                      ? "Masukkan password saat ini dan password baru Anda."
                      : "Buat password baru untuk akun Anda."}
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  {data.hasPassword && (
                    <Field>
                      <FieldLabel htmlFor="current-password">
                        Password Saat Ini
                      </FieldLabel>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </Field>
                  )}
                  <Field>
                    <FieldLabel htmlFor="new-password">Password Baru</FieldLabel>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Minimal 8 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Konfirmasi Password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPasswordDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      saving || !newPassword || newPassword !== confirmPassword
                    }
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {data.hasPassword && (
              <Button
                variant="outline"
                onClick={handleResetPassword}
                disabled={resetSending}
              >
                <RotateCcw data-icon="inline-start" />
                {resetSending ? "Mengirim..." : "Lupa Password"}
              </Button>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="mb-2 text-sm font-medium">Akun Terhubung</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Akun OAuth yang terhubung untuk login cepat.
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  G
                </div>
                <div>
                  <p className="text-sm font-medium">Google</p>
                  {connectedAccounts.find((a) => a.provider === "google") ? (
                    <p className="text-xs text-muted-foreground">Terhubung</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Belum terhubung
                    </p>
                  )}
                </div>
              </div>
              {connectedAccounts.find((a) => a.provider === "google") ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleUnlink("google")}
                >
                  Putuskan
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await authClient.signIn.social({ provider: "google" })
                  }}
                >
                  Hubungkan
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import * as React from "react"
import { CheckCircle2, Mail, Send, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/eden-client"
import { getErrorMessage, getInitials } from "@/lib/utils"
import type { ProfileData } from "./types"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

interface Props {
  data: ProfileData
  slug: string
  onUpdated: () => void
}

export function AccountInfoSection({ data, slug, onUpdated }: Props) {
  const [name, setName] = React.useState(data.user.name)
  const [saving, setSaving] = React.useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false)
  const [newEmail, setNewEmail] = React.useState("")
  const [sendingVerification, setSendingVerification] = React.useState(false)
  const [changingEmail, setChangingEmail] = React.useState(false)

  React.useEffect(() => {
    setName(data.user.name)
  }, [data.user.name])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .profile.put({ name: name.trim() })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal menyimpan profil")
      } else {
        toast.success("Profil berhasil diperbarui!")
        onUpdated()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleResendVerification() {
    setSendingVerification(true)
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: data.user.email,
        callbackURL: `${window.location.origin}/orgs/${slug}/profile`,
      })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengirim ulang verifikasi")
      } else {
        toast.success("Email verifikasi telah dikirim! Silakan cek inbox Anda.")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSendingVerification(false)
    }
  }

  async function handleChangeEmail() {
    if (!newEmail.trim()) return
    setChangingEmail(true)
    try {
      const { error } = await authClient.changeEmail({
        newEmail: newEmail.trim(),
        callbackURL: `${window.location.origin}/orgs/${slug}/profile`,
      })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengubah email")
      } else {
        toast.success(
          "Email verifikasi telah dikirim ke alamat email baru. Silakan cek inbox Anda."
        )
        setEmailDialogOpen(false)
        setNewEmail("")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setChangingEmail(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Akun</CardTitle>
        <CardDescription>Data diri dan verifikasi akun Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="profile-name">Nama</FieldLabel>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="profile-email">Email</FieldLabel>
            <div className="flex gap-2">
              <InputGroup>
                <InputGroupInput
                  id="profile-email"
                  value={data.user.email}
                  readOnly
                  className="flex-1"
                />
                {data.user.emailVerified ? (
                  <InputGroupAddon align="inline-end">
                    <Badge variant="ghost">
                      <CheckCircle2 />
                      Terverifikasi
                    </Badge>
                  </InputGroupAddon>
                ) : (
                  <InputGroupAddon align="inline-end">
                    <Badge variant="destructive">
                      <XCircle data-icon="inline-start" />
                      Belum Verifikasi
                    </Badge>
                  </InputGroupAddon>
                )}
              </InputGroup>
              <div className="flex flex-wrap gap-2">
                <Dialog
                  open={emailDialogOpen}
                  onOpenChange={setEmailDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Mail data-icon="inline-start" />
                      Ganti Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ganti Email</DialogTitle>
                      <DialogDescription>
                        Masukkan alamat email baru. Email verifikasi akan
                        dikirim ke alamat tersebut.
                      </DialogDescription>
                    </DialogHeader>
                    <Field>
                      <FieldLabel htmlFor="new-email">Email Baru</FieldLabel>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="nama@example.com"
                      />
                    </Field>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setEmailDialogOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={handleChangeEmail}
                        disabled={changingEmail || !newEmail.trim()}
                      >
                        {changingEmail ? "Mengirim..." : "Kirim Verifikasi"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {!data.user.emailVerified && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={sendingVerification}
                  >
                    <Send data-icon="inline-start" />
                    {sendingVerification
                      ? "Mengirim..."
                      : "Kirim Ulang Verifikasi"}
                  </Button>
                )}
              </div>
            </div>
          </Field>
          <Field>
            <FieldLabel>Bergabung Sejak</FieldLabel>
            <p className="text-sm text-muted-foreground">
              {new Date(data.user.createdAt).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave} disabled={!name.trim() || saving}>
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </CardFooter>
    </Card>
  )
}

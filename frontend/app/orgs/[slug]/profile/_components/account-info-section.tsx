"use client"

import * as React from "react"
import { Camera, CheckCircle2, Mail, Send, Upload, XCircle } from "lucide-react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { authClient } from "@/lib/auth-client"
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
  const [avatarUploading, setAvatarUploading] = React.useState(false)
  const [avatarUrl, setAvatarUrl] = React.useState(data.user.image ?? "")
  const [avatarDialogOpen, setAvatarDialogOpen] = React.useState(false)

  React.useEffect(() => {
    setName(data.user.name)
    setAvatarUrl(data.user.image ?? "")
  }, [data.user.name, data.user.image])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"
        }/api/orgs/${slug}/profile`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        }
      )
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error ?? "Gagal menyimpan profil")
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

  async function handleAvatarUpload(file: File) {
    setAvatarUploading(true)
    try {
      // Upload file
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"
        }/api/upload/avatar`,
        { method: "POST", credentials: "include", body: formData }
      )
      const uploadJson = await uploadRes.json()
      if (!uploadJson.success) {
        toast.error(uploadJson.error ?? "Gagal mengunggah avatar")
        return
      }

      const url = uploadJson.data.url

      // Update avatar via API
      const avatarRes = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"
        }/api/orgs/${slug}/profile/avatar`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: url }),
        }
      )
      const avatarJson = await avatarRes.json()
      if (!avatarJson.success) {
        toast.error(avatarJson.error ?? "Gagal memperbarui avatar")
        return
      }

      setAvatarUrl(url)
      toast.success("Foto profil berhasil diperbarui!")
      setAvatarDialogOpen(false)
      onUpdated()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Akun</CardTitle>
        <CardDescription>Data diri dan verifikasi akun Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-16">
              <AvatarImage src={avatarUrl || undefined} alt={data.user.name} />
              <AvatarFallback className="text-lg">
                {getInitials(data.user.name)}
              </AvatarFallback>
            </Avatar>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -right-1 -bottom-1 size-7 rounded-full"
                  onClick={() => setAvatarDialogOpen(true)}
                >
                  <Camera className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ubah foto profil</TooltipContent>
            </Tooltip>
          </div>
          <div>
            <p className="font-medium">{data.user.name}</p>
            <p className="text-sm text-muted-foreground">{data.user.email}</p>
          </div>
        </div>

        <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ubah Foto Profil</DialogTitle>
              <DialogDescription>
                Pilih file gambar untuk foto profil Anda.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
              <Avatar className="size-24">
                <AvatarImage
                  src={avatarUrl || undefined}
                  alt={data.user.name}
                />
                <AvatarFallback className="text-2xl">
                  {getInitials(data.user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex w-full flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={avatarUploading}
                  onClick={() => {
                    const input = document.createElement("input")
                    input.type = "file"
                    input.accept = "image/png,image/jpeg,image/jpg,image/webp"
                    input.onchange = async () => {
                      const file = input.files?.[0]
                      if (file) await handleAvatarUpload(file)
                    }
                    input.click()
                  }}
                >
                  <Upload data-icon="inline-start" />
                  {avatarUploading ? "Mengunggah..." : "Pilih Gambar"}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAvatarDialogOpen(false)}
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

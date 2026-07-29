"use client"

import * as React from "react"
import { Save, Upload, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { WhiteLabelData } from "./types"

interface Props {
  whiteLabel: WhiteLabelData
  slug: string
  onUpdated: () => void
}

export function WhiteLabelSection({ whiteLabel, slug, onUpdated }: Props) {
  const [logoDark, setLogoDark] = React.useState(whiteLabel.logoDark ?? "")
  const [logoLight, setLogoLight] = React.useState(whiteLabel.logoLight ?? "")
  const [customDomain, setCustomDomain] = React.useState(
    whiteLabel.customDomain ?? ""
  )
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState<"dark" | "light" | null>(
    null
  )
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogType, setDialogType] = React.useState<"dark" | "light">("light")

  const FRONTEND_URL =
    process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://kreatur.sekeco.work"
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"

  React.useEffect(() => {
    setLogoDark(whiteLabel.logoDark ?? "")
    setLogoLight(whiteLabel.logoLight ?? "")
    setCustomDomain(whiteLabel.customDomain ?? "")
  }, [whiteLabel])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/orgs/${slug}/settings/white-label`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logoDark: logoDark.trim() || null,
            logoLight: logoLight.trim() || null,
            customDomain: customDomain.trim() || null,
          }),
        }
      )
      const json = (await res.json()) as { success: boolean; error?: string }
      if (!json.success) {
        toast.error(json.error ?? "Gagal menyimpan")
      } else {
        toast.success("Pengaturan white-label berhasil diperbarui!")
        onUpdated()
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  function openUpload(type: "dark" | "light") {
    setDialogType(type)
    setDialogOpen(true)
  }

  async function handleUpload() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/png,image/jpeg,image/svg+xml"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      setUploading(dialogType)
      setDialogOpen(false)
      try {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch(`${BACKEND_URL}/api/upload/logo`, {
          method: "POST",
          credentials: "include",
          body: formData,
        })
        const json = await res.json()
        if (!json.success) {
          toast.error(json.error ?? "Gagal mengunggah")
          return
        }

        const url = json.data.url

        // Simpan logo langsung ke database
        const saveRes = await fetch(
          `${BACKEND_URL}/api/orgs/${slug}/settings/white-label`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              [dialogType === "dark" ? "logoDark" : "logoLight"]: url,
              [dialogType === "dark" ? "logoLight" : "logoDark"]:
                dialogType === "dark"
                  ? logoLight.trim() || null
                  : logoDark.trim() || null,
              customDomain: customDomain.trim() || null,
            }),
          }
        )
        const saveJson = await saveRes.json()
        if (!saveJson.success) {
          toast.error(saveJson.error ?? "Gagal menyimpan logo")
          return
        }

        if (dialogType === "dark") {
          setLogoDark(url)
        } else {
          setLogoLight(url)
        }

        toast.success("Logo berhasil diunggah!")
        onUpdated()
        setTimeout(() => window.location.reload(), 1000)
      } catch {
        toast.error("Gagal mengunggah file")
      } finally {
        setUploading(null)
      }
    }
    input.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>White-label</CardTitle>
        <CardDescription>
          Sesuaikan tampilan ruang kerja Anda dengan logo dan domain kustom.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ─── Logo ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <h4 className="text-sm leading-none font-medium">Logo</h4>
          <p className="text-xs text-muted-foreground">
            Unggah logo untuk tampilan terang (light mode) dan gelap (dark
            mode). Format: PNG, JPG, atau SVG. Maks. 5MB. Ukuran terbaik: 180x32
            piksel (lebar x tinggi).
          </p>

          {/* Light Mode Logo */}
          <div>
            <FieldLabel>Logo — Light Mode</FieldLabel>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex h-10 w-[180px] items-center justify-center rounded-lg border bg-white">
                {logoLight ? (
                  <img
                    src={logoLight}
                    alt="Light logo"
                    className="h-8 max-w-[172px] object-contain"
                  />
                ) : (
                  <span className="text-xs text-neutral-400">
                    Belum ada logo
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  onClick={() => openUpload("light")}
                  disabled={uploading === "light"}
                >
                  <Upload data-icon="inline-start" />
                  {logoLight ? "Ganti" : "Unggah"}
                </Button>
                {logoLight && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLogoLight("")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Dark Mode Logo */}
          <div>
            <FieldLabel>Logo — Dark Mode</FieldLabel>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex h-10 w-[180px] items-center justify-center rounded-lg border bg-neutral-800">
                {logoDark ? (
                  <img
                    src={logoDark}
                    alt="Dark logo"
                    className="h-8 max-w-[172px] object-contain"
                  />
                ) : (
                  <span className="text-xs text-neutral-500">
                    Belum ada logo
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  onClick={() => openUpload("dark")}
                  disabled={uploading === "dark"}
                >
                  <Upload data-icon="inline-start" />
                  {logoDark ? "Ganti" : "Unggah"}
                </Button>
                {logoDark && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLogoDark("")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upload Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unggah Logo</DialogTitle>
              <DialogDescription>
                Pilih file gambar untuk logo{" "}
                {dialogType === "light" ? "light mode" : "dark mode"}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-10 w-[180px] items-center justify-center rounded-lg border bg-muted">
                <span className="text-xs text-muted-foreground">
                  180 × 32 px
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleUpload}
                disabled={uploading === dialogType}
              >
                <Upload data-icon="inline-start" />
                Pilih File
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Separator />

        {/* ─── Domain Kustom ────────────────────────────────────── */}
        <div className="space-y-4">
          <h4 className="text-sm leading-none font-medium">Domain Kustom</h4>
          <p className="text-xs text-muted-foreground">
            Gunakan domain Anda sendiri untuk mengakses ruang kerja ini.
          </p>

          <Field>
            <FieldLabel htmlFor="custom-domain">Domain</FieldLabel>
            <Input
              id="custom-domain"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="kreatur.kustom.com"
            />
          </Field>

          {customDomain && (
            <Alert>
              <AlertTitle>Cara Mengatur DNS</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>
                  Agar domain kustom Anda berfungsi, buka panel penyedia domain
                  Anda dan tambahkan CNAME record berikut:
                </p>

                <div className="rounded-md border bg-muted p-3 font-mono text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="pr-6 pb-1 font-medium">Tipe</th>
                        <th className="pr-6 pb-1 font-medium">Nama</th>
                        <th className="pb-1 font-medium">Nilai</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="pr-6">CNAME</td>
                        <td className="pr-6">{customDomain.split(".")[0]}</td>
                        <td>{FRONTEND_URL.replace("https://", "")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p>
                  Setelah record ditambahkan, propagasi DNS membutuhkan waktu
                  beberapa menit hingga 24 jam.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave} disabled={saving}>
          <Save data-icon="inline-start" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </CardFooter>
    </Card>
  )
}

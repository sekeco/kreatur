"use client"

import * as React from "react"
import { CheckCircle2, Smartphone, Trash2 } from "lucide-react"
import { toast } from "sonner"

import QRCode from "qrcode"
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/eden-client"
import { getErrorMessage } from "@/lib/utils"
import type { ProfileData } from "./types"

interface Props {
  data: ProfileData
  slug: string
  onUpdated: () => void
}

// ─── TOTP Setup Display ────────────────────────────────

function TotpSetupDisplay({ uri }: { uri: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!canvasRef.current) return
    let cancelled = false
    QRCode.toCanvas(
      canvasRef.current,
      uri,
      { width: 240, margin: 2 },
      (err) => {
        if (err && !cancelled) console.error("QR Code error:", err)
      }
    )
    return () => {
      cancelled = true
    }
  }, [uri])

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(uri)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-lg border bg-card p-4">
        <canvas ref={canvasRef} width={240} height={240} className="rounded" />
      </div>

      <div className="flex w-full max-w-sm items-center gap-2">
        <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs">
          {uri}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="shrink-0"
        >
          {copied ? "Tersalin!" : "Salin"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Scan QR code di atas menggunakan Google Authenticator atau Authy, atau
        salin tautan secara manual.
      </p>
    </div>
  )
}

// ─── Section: 2FA ────────────────────────────────────────

export function TwoFactorSection({ data, slug, onUpdated }: Props) {
  const [password, setPassword] = React.useState("")
  const [totpCode, setTotpCode] = React.useState("")
  const [totpURI, setTotpURI] = React.useState<string | null>(null)
  const [backupCodes, setBackupCodes] = React.useState<string[]>([])
  const [viewingCodes, setViewingCodes] = React.useState(false)
  const [codes, setCodes] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [step, setStep] = React.useState<"idle" | "setup" | "verify" | "done">(
    "idle"
  )

  const isEnabled = data.user.twoFactorEnabled

  async function handleEnable() {
    if (!password) {
      toast.error("Masukkan password untuk mengaktifkan 2FA")
      return
    }
    setLoading(true)
    try {
      const { data: result, error } = await api.api
        .orgs({ slug })
        .profile["2fa"].enable.post({ password })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengaktifkan 2FA")
      } else if (result?.data) {
        setTotpURI(result.data.totpURI)
        setBackupCodes(result.data.backupCodes ?? [])
        setStep("verify")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!totpCode) return
    setLoading(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .profile["2fa"].verify.post({ code: totpCode })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Kode TOTP tidak valid")
      } else {
        toast.success("2FA berhasil diaktifkan!")
        setStep("done")
        onUpdated()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable() {
    if (!password) {
      toast.error("Masukkan password untuk menonaktifkan 2FA")
      return
    }
    setLoading(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .profile["2fa"].disable.post({ password })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal menonaktifkan 2FA")
      } else {
        toast.success("2FA berhasil dinonaktifkan")
        setPassword("")
        setStep("idle")
        onUpdated()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  async function handleViewBackupCodes() {
    setViewingCodes(true)
    try {
      const { data: result, error } = await api.api
        .orgs({ slug })
        .profile["2fa"]["backup-codes"].get()
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengambil kode cadangan")
      } else if (result?.data) {
        setCodes(result.data.backupCodes ?? [])
      }
    } catch {
      toast.error("Terjadi kesalahan")
    }
  }

  async function handleRegenerateBackupCodes() {
    if (!password) {
      toast.error("Masukkan password untuk membuat ulang kode cadangan")
      return
    }
    setLoading(true)
    try {
      const { data: result, error } = await api.api
        .orgs({ slug })
        .profile["2fa"]["backup-codes"].post({ password })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal membuat kode cadangan")
      } else if (result?.data) {
        setCodes(result.data.backupCodes ?? [])
        toast.success("Kode cadangan baru berhasil dibuat!")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  if (step === "done") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Autentikasi Dua Faktor Aktif</CardTitle>
          <CardDescription>
            Setiap kali login, Anda akan diminta memasukkan kode TOTP dari
            aplikasi autentikator.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleViewBackupCodes}>
              Lihat Kode Cadangan
            </Button>
            <Button
              variant="outline"
              onClick={handleRegenerateBackupCodes}
              disabled={loading}
            >
              Buat Ulang Kode Cadangan
            </Button>
          </div>

          <Dialog open={viewingCodes} onOpenChange={setViewingCodes}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kode Cadangan</DialogTitle>
                <DialogDescription>
                  Simpan kode-kode ini di tempat aman.
                </DialogDescription>
              </DialogHeader>
              {codes.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {codes.map((code, i) => (
                    <code
                      key={i}
                      className="rounded bg-muted px-3 py-2 text-sm"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Klik &quot;Buat Ulang Kode Cadangan&quot; untuk membuat kode
                  baru.
                </p>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setViewingCodes(false)}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    )
  }

  if (step === "setup" || step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {step === "setup"
              ? "Aktifkan Autentikasi Dua Faktor"
              : "Verifikasi TOTP"}
          </CardTitle>
          <CardDescription>
            {step === "setup"
              ? "Langkah 1: Masukkan password Anda untuk memulai."
              : "Langkah 2: Salin tautan ke aplikasi autentikator Anda, lalu masukkan kode TOTP."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "setup" && (
            <Field>
              <FieldLabel htmlFor="2fa-password">Password</FieldLabel>
              <Input
                id="2fa-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password akun Anda"
              />
            </Field>
          )}
          {step === "verify" && totpURI && (
            <div className="flex flex-col gap-4">
              <TotpSetupDisplay uri={totpURI} />

              {backupCodes.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                  <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                    Kode Cadangan
                  </p>
                  <p className="mb-3 text-xs text-amber-700 dark:text-amber-300">
                    Simpan kode-kode ini di tempat aman. Setiap kode hanya bisa
                    digunakan sekali untuk masuk jika Anda kehilangan akses ke
                    aplikasi autentikator.
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {backupCodes.map((code, i) => (
                      <code
                        key={i}
                        className="rounded bg-amber-100 px-2 py-1 text-xs dark:bg-amber-900"
                      >
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              <Field className="max-w-xs">
                <FieldLabel htmlFor="totp-code">Kode TOTP</FieldLabel>
                <Input
                  id="totp-code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </Field>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between border-t px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => {
              setStep("idle")
              setPassword("")
              // close modal
              setTotpCode("")
            }}
          >
            Batal
          </Button>
          {step === "setup" ? (
            <Button onClick={handleEnable} disabled={loading || !password}>
              {loading ? "Memproses..." : "Lanjutkan"}
            </Button>
          ) : (
            <Button
              onClick={handleVerify}
              disabled={loading || totpCode.length !== 6}
            >
              {loading ? "Memverifikasi..." : "Verifikasi & Aktifkan"}
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Autentikasi Dua Faktor (2FA)</CardTitle>
        <CardDescription>
          Tingkatkan keamanan akun Anda dengan autentikasi dua faktor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-muted">
              {isEnabled ? (
                <CheckCircle2 className="size-4 text-green-600" />
              ) : (
                <Smartphone className="size-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                Aplikasi Autentikator (TOTP)
              </p>
              <p className="text-xs text-muted-foreground">
                {isEnabled
                  ? "Aktif — menggunakan Google Authenticator atau sejenisnya"
                  : "Nonaktif — menambahkan lapisan keamanan ekstra"}
              </p>
            </div>
          </div>
          {isEnabled ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-destructive">
                  Nonaktifkan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nonaktifkan 2FA</DialogTitle>
                  <DialogDescription>
                    Masukkan password Anda untuk menonaktifkan autentikasi dua
                    faktor.
                  </DialogDescription>
                </DialogHeader>
                <Field>
                  <FieldLabel htmlFor="disable-2fa-password">
                    Password
                  </FieldLabel>
                  <Input
                    id="disable-2fa-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" onClick={() => setPassword("")}>
                      Batal
                    </Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleDisable}
                    disabled={loading || !password}
                    className="gap-2"
                  >
                    <Trash2 data-icon="inline-start" />
                    {loading ? "Memproses..." : "Nonaktifkan 2FA"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : data.hasPassword ? (
            <Button variant="outline" onClick={() => setStep("setup")}>
              Aktifkan
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Buat password terlebih dahulu untuk mengaktifkan 2FA
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

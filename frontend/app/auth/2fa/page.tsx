"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Globe, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { APP_CONFIG } from "@/lib/app-config"
import { authClient } from "@/lib/auth-client"

export default function TwoFactorPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [totpCode, setTotpCode] = React.useState("")
  const [backupCode, setBackupCode] = React.useState("")
  const [useBackup, setUseBackup] = React.useState(false)
  const [trustDevice, setTrustDevice] = React.useState(true)
  const [loading, setLoading] = React.useState(false)

  async function handleVerify() {
    const code = useBackup ? backupCode.trim() : totpCode.trim()
    if (!code) return

    setLoading(true)
    try {
      if (useBackup) {
        const { error } = await authClient.twoFactor.verifyBackupCode({
          code,
          trustDevice,
        })
        if (error) {
          toast.error(error.message ?? "Kode cadangan tidak valid")
          return
        }
      } else {
        const { error } = await authClient.twoFactor.verifyTotp({
          code,
          trustDevice,
        })
        if (error) {
          toast.error(error.message ?? "Kode TOTP tidak valid")
          return
        }
      }

      toast.success("Verifikasi berhasil!")

      const orgs = await authClient.organization.list()
      if (orgs.data && orgs.data.length > 0) {
        await authClient.organization.setActive({
          organizationId: orgs.data[0].id,
        })
        window.location.href = `/orgs/${orgs.data[0].slug}/dashboard`
      } else {
        router.push("/boarding")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    await authClient.signOut()
    router.push("/auth/signin")
  }

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 px-4 sm:w-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldAlert className="size-6 text-primary" />
          </div>
          <h1 className="text-3xl font-medium">Verifikasi Dua Langkah</h1>
          <p className="text-sm text-muted-foreground">
            Masukkan kode dari aplikasi autentikator Anda untuk melanjutkan.
          </p>
          {session?.user && (
            <p className="text-sm font-medium">{session.user.email}</p>
          )}
        </div>

        <div className="space-y-4">
          <FieldGroup className="gap-4">
            {!useBackup ? (
              <Field>
                <FieldLabel htmlFor="totp-code">Kode TOTP</FieldLabel>
                <Input
                  id="totp-code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  className="text-center text-lg tracking-widest"
                />
              </Field>
            ) : (
              <Field>
                <FieldLabel htmlFor="backup-code">Kode Cadangan</FieldLabel>
                <Input
                  id="backup-code"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="Masukkan kode cadangan"
                  autoFocus
                />
              </Field>
            )}

            <Field orientation="horizontal">
              <Checkbox
                id="trust-device"
                checked={trustDevice}
                onCheckedChange={(checked) => setTrustDevice(Boolean(checked))}
              />
              <FieldContent>
                <FieldLabel htmlFor="trust-device" className="font-normal">
                  Percayai perangkat ini selama 30 hari
                </FieldLabel>
              </FieldContent>
            </Field>

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={
                loading ||
                (useBackup ? !backupCode.trim() : totpCode.length !== 6)
              }
            >
              {loading && <Spinner />}
              {loading ? "Memverifikasi..." : "Verifikasi"}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setUseBackup(!useBackup)
                setTotpCode("")
                setBackupCode("")
              }}
            >
              {useBackup ? "Gunakan kode TOTP" : "Gunakan kode cadangan"}
            </Button>
          </FieldGroup>
        </div>

        <div className="text-center text-sm">
          <Button
            variant="link"
            className="text-muted-foreground"
            onClick={handleCancel}
          >
            Batalkan dan keluar
          </Button>
        </div>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-4 lg:px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          ID
        </div>
      </div>
    </>
  )
}

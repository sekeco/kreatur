"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Globe, Loader2, MailCheck, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { APP_CONFIG } from "@/lib/app-config"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/eden-client"

/**
 * Set active org & redirect ke dashboard.
 * Jika ada pendingJoinSlug (dari halaman /join/[slug]),
 * selesaikan join dulu sebelum redirect.
 */
async function redirectAfterAuth(router: ReturnType<typeof useRouter>) {
  const pendingSlug = localStorage.getItem("pendingJoinSlug")

  if (pendingSlug) {
    localStorage.removeItem("pendingJoinSlug")

    const { error } = await api.api.orgs({ slug: pendingSlug }).join.post()
    if (error) {
      // Gagal join — fallback ke boarding
      router.push("/boarding")
      return
    }

    await authClient.organization.setActive({
      organizationSlug: pendingSlug,
    })
    window.location.href = `/orgs/${pendingSlug}/dashboard`
    return
  }

  // Normal flow — user punya org atau langsung ke boarding
  const { data: orgs } = await authClient.organization.list()
  if (orgs && orgs.length > 0) {
    const org = orgs[0]
    await authClient.organization.setActive({ organizationId: org.id })
    window.location.href = `/orgs/${org.slug}/dashboard`
  } else {
    router.push("/boarding")
  }
}

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<
    "idle" | "verifying" | "verified" | "failed" | "redirecting"
  >("idle")
  const [resending, setResending] = useState(false)
  const { data: session } = authClient.useSession()

  // Jika tiba di sini via callbackURL dari server (autoSignIn) & email sudah verified → redirect
  useEffect(() => {
    if (status !== "idle") return
    if (!token && session?.user?.emailVerified) {
      setStatus("redirecting")
      redirectAfterAuth(router)
    }
  }, [token, session, status, router])

  // Auto-verify jika ada token di URL (frontend-side verification)
  useEffect(() => {
    if (!token || status !== "idle") return
    setStatus("verifying")
    authClient.verifyEmail({ query: { token } }).then(async ({ error }) => {
      if (error) {
        setStatus("failed")
        toast.error(error.message ?? "Gagal memverifikasi email")
      } else {
        setStatus("verified")
        toast.success("Email berhasil diverifikasi!")
        await redirectAfterAuth(router)
      }
    })
  }, [token, status, router])

  async function handleResend() {
    const email = session?.user?.email
    if (!email) {
      toast.error("Tidak dapat memperoleh email Anda. Silakan masuk kembali.")
      return
    }
    setResending(true)
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: `${window.location.origin}/auth/verify-email`,
    })
    setResending(false)
    if (error) {
      toast.error(error.message ?? "Gagal mengirim email verifikasi")
      return
    }
    toast.success("Email verifikasi telah dikirim ulang.")
  }

  // Sedang memverifikasi / redirecting
  if (status === "verifying" || status === "redirecting") {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-87.5">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-medium">
            {status === "verifying" ? "Memverifikasi email…" : "Mengarahkan…"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Mohon tunggu sebentar.
          </p>
        </div>
      </div>
    )
  }

  // Gagal verifikasi
  if (status === "failed") {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-87.5">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="size-6 text-destructive" />
          </div>
          <h1 className="text-3xl font-medium">Verifikasi gagal</h1>
          <p className="text-sm text-muted-foreground">
            Tautan verifikasi tidak valid atau sudah kedaluwarsa. Silakan coba
            lagi.
          </p>
        </div>
        <Button
          className="w-full"
          variant="outline"
          disabled={resending}
          onClick={handleResend}
        >
          {resending && <Spinner />}
          Kirim Ulang Email
        </Button>
        <Link
          href={APP_CONFIG.links.signin}
          className="block text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Kembali ke halaman masuk
        </Link>
      </div>
    )
  }

  // Berhasil verifikasi — sudah redirect, ini fallback
  if (status === "verified") {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-87.5">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
            <MailCheck className="size-6 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-medium">Email terverifikasi!</h1>
          <p className="text-sm text-muted-foreground">
            Mengarahkan Anda ke dashboard…
          </p>
        </div>
        <div className="flex justify-center">
          <Spinner />
        </div>
      </div>
    )
  }

  // Halaman default — instruksi cek email (juga: session ada tapi email belum verified)
  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-87.5">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <MailCheck className="size-6 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-medium">Cek email Anda</h1>
          <p className="text-sm text-muted-foreground">
            Email Anda belum diverifikasi. Silakan klik tautan yang kami
            kirimkan ke email Anda.
          </p>
        </div>
        <div className="space-y-3">
          <Button
            className="w-full"
            variant="outline"
            disabled={resending}
            onClick={handleResend}
          >
            {resending && <Spinner />}
            Kirim Ulang Email
          </Button>
          <div className="flex items-center justify-center">
            <Button
              variant="link"
              className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
              onClick={async () => {
                if (session) await authClient.signOut()
                router.push(APP_CONFIG.links.signin)
              }}
            >
              Keluar dan masuk dengan akun lain
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          ID
        </div>
      </div>
    </>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}

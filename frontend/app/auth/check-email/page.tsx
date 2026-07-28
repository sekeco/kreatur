"use client"

import { useState } from "react"
import Link from "next/link"
import { Globe, MailSearch } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { APP_CONFIG } from "@/lib/app-config"
import { authClient } from "@/lib/auth-client"

export default function CheckEmailPage() {
  const [resending, setResending] = useState(false)

  async function handleResend() {
    const email = sessionStorage.getItem("resetEmail")
    if (!email) {
      toast.error(
        "Email tidak ditemukan. Silakan ulangi dari halaman lupa kata sandi."
      )
      return
    }

    setResending(true)
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setResending(false)

    if (error) {
      toast.error(error.message ?? "Gagal mengirim ulang email reset")
      return
    }

    toast.info("Email reset telah dikirim ulang.")
  }

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 px-4 sm:w-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <MailSearch className="size-6 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-medium">Cek email Anda</h1>
          <p className="text-sm text-muted-foreground">
            Jika email terdaftar, kami telah mengirimkan tautan reset kata
            sandi. Silakan periksa kotak masuk Anda.
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
          <Link
            href={APP_CONFIG.links.signin}
            className="block text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Kembali ke halaman masuk
          </Link>
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

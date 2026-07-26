"use client"

import Link from "next/link"
import { Globe, MailSearch } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { APP_CONFIG } from "@/lib/app-config"

export default function CheckEmailPage() {
  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-87.5">
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
            onClick={() => {
              toast.info("Email reset telah dikirim ulang.")
            }}
          >
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

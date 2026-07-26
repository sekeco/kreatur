"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { Globe, Loader2 } from "lucide-react"

import { APP_CONFIG } from "@/lib/app-config"
import { authClient } from "@/lib/auth-client"
import { redirectAfterAuth } from "@/lib/auth-redirect"

function OAuthCallbackContent() {
  const [status] = useState<"loading" | "redirecting">("loading")
  const handled = useRef(false)
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (handled.current || isPending) return

    if (!session) {
      handled.current = true
      const timer = setTimeout(() => {
        window.location.href = "/auth/signin"
      }, 2000)
      return () => clearTimeout(timer)
    }

    handled.current = true
    redirectAfterAuth()
  }, [session, isPending])

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-87.5">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-medium">
          {status === "loading"
            ? "Memproses masuk..."
            : "Mengarahkan ke dashboard..."}
        </h1>
        <p className="text-sm text-muted-foreground">Mohon tunggu sebentar.</p>
      </div>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <>
      <Suspense>
        <OAuthCallbackContent />
      </Suspense>

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

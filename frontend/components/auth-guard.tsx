"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

interface AuthGuardProps {
  children: ReactNode
  /** Wajib email terverifikasi (default true) */
  requireVerified?: boolean
  /** Redirect ke sini kalau tidak login */
  redirectTo?: string
}

/**
 * Auth guard — bungkus halaman yang butuh autentikasi.
 *
 * @example
 * ```tsx
 * <AuthGuard>
 *   <h1>Hanya untuk yang sudah login + verified</h1>
 * </AuthGuard>
 *
 * <AuthGuard requireVerified={false}>
 *   <h1>Login saja cukup, verifikasi opsional</h1>
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  requireVerified = true,
  redirectTo = "/auth/signin",
}: AuthGuardProps) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending) return

    if (!session) {
      router.push(redirectTo)
      return
    }

    if (requireVerified && !session.user.emailVerified) {
      router.push("/auth/verify-email")
    }
  }, [session, isPending, router, redirectTo, requireVerified])

  if (isPending) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">Memuat...</p>
      </div>
    )
  }

  if (!session) return null
  if (requireVerified && !session.user.emailVerified) return null

  return <>{children}</>
}

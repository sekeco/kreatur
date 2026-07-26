"use client"

import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { twoFactorClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000",
  plugins: [
    organizationClient(),
    twoFactorClient({
      onTwoFactorRedirect({ twoFactorMethods }) {
        // Arahkan ke halaman verifikasi 2FA jika diperlukan saat sign-in
        window.location.href = "/auth/2fa"
      },
    }),
  ],
})

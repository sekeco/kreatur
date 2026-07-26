"use client"

import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/eden-client"

/**
 * Set active org & redirect ke dashboard setelah auth berhasil.
 * Jika ada pendingJoinSlug (dari halaman /join/[slug]),
 * selesaikan join dulu sebelum redirect.
 */
export async function redirectAfterAuth() {
  const pendingSlug = localStorage.getItem("pendingJoinSlug")

  if (pendingSlug) {
    localStorage.removeItem("pendingJoinSlug")

    const { error } = await api.api.orgs({ slug: pendingSlug }).join.post()
    if (error) {
      // Gagal join — fallback ke boarding
      window.location.href = "/boarding"
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
    window.location.href = "/boarding"
  }
}

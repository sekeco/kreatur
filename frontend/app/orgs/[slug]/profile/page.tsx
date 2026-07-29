"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { ProfileData } from "./_components/types"

import { AccountInfoSection } from "./_components/account-info-section"
import { DangerSection } from "./_components/danger-section"
import { PayoutPreferencesSection } from "./_components/payout-preferences-section"
import { SecuritySection } from "./_components/security-section"
import { TwoFactorSection } from "./_components/two-factor-section"
import { SessionsSection } from "./_components/sessions-section"

export default function ProfilePage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [data, setData] = React.useState<ProfileData | null>(null)
  const [loading, setLoading] = React.useState(true)

  const fetchProfile = React.useCallback(() => {
    if (!slug) return
    setLoading(true)
    fetch(
      `${
        process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"
      }/api/orgs/${slug}/profile`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then((res: any) => {
        if (res?.success) setData(res.data as unknown as ProfileData)
      })
      .finally(() => setLoading(false))
  }, [slug])

  React.useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  if (loading) {
    return (
      <div className="@container/main flex flex-col gap-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-56" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="@container/main mx-auto flex max-w-4xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-medium">Profil Saya</h1>
        <p className="text-sm text-muted-foreground">
          Kelola informasi akun, preferensi, dan keamanan akun Anda.
        </p>
      </div>

      {data && (
        <>
          <AccountInfoSection
            data={data}
            slug={slug}
            onUpdated={fetchProfile}
          />
          <PayoutPreferencesSection
            data={data}
            slug={slug}
            onUpdated={fetchProfile}
          />
          <SecuritySection data={data} slug={slug} onUpdated={fetchProfile} />
          <TwoFactorSection data={data} slug={slug} onUpdated={fetchProfile} />
          <SessionsSection sessions={data.sessions} slug={slug} />
          <DangerSection />
        </>
      )}
    </div>
  )
}

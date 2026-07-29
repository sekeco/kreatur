"use client"

import * as React from "react"
import { useParams } from "next/navigation"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { SettingsData } from "./_components/types"

import { ProfileSection } from "./_components/profile-section"
import { WhiteLabelSection } from "./_components/white-label-section"
import { HonorSection } from "./_components/honor-section"
import { PreferencesSection } from "./_components/preferences-section"

export default function SettingsPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [data, setData] = React.useState<SettingsData | null>(null)
  const [loading, setLoading] = React.useState(true)

  const fetchSettings = React.useCallback(() => {
    if (!slug) return
    setLoading(true)
    fetch(
      `${
        process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"
      }/api/orgs/${slug}/settings`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then((res: any) => {
        if (res?.success) {
          const settingsData = res.data as unknown as SettingsData
          setData(settingsData)
          // Cache white-label logos for sidebar use
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem(
                "kreatur-white-label",
                JSON.stringify(settingsData.whiteLabel)
              )
            } catch {}
          }
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  React.useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  if (loading) {
    return (
      <div className="@container/main flex flex-col gap-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
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
        <h1 className="text-2xl font-medium">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola pengaturan ruang kerja Anda.
        </p>
      </div>

      {data && (
        <>
          <ProfileSection
            workspace={data.workspace}
            slug={slug}
            onUpdated={fetchSettings}
          />

          <WhiteLabelSection
            whiteLabel={data.whiteLabel}
            slug={slug}
            onUpdated={fetchSettings}
          />

          <HonorSection payoutRules={data.payoutRules} slug={slug} />

          <PreferencesSection preferences={data.preferences} slug={slug} />
        </>
      )}
    </div>
  )
}

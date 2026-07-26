"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Building2, ChevronsUpDown, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

export function OrgSwitcher() {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const [orgs, setOrgs] = useState<
    {
      id: string
      name: string
      slug: string
      metadata?: Record<string, unknown> | null
    }[]
  >([])

  useEffect(() => {
    authClient.organization.list().then((res) => {
      if (res.data) setOrgs(res.data as typeof orgs)
    })
  }, [])

  const activeOrg = orgs.find((o) => o.slug === slug)

  async function handleSetActive(orgId: string, orgSlug: string) {
    await authClient.organization.setActive({ organizationId: orgId })
    router.push(`/orgs/${orgSlug}/dashboard`)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex size-8 items-center justify-center rounded-lg border bg-background text-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeOrg?.name ?? "Pilih ruang kerja"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeOrg?.slug ?? ""}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Ruang Kerja
            </DropdownMenuLabel>
            {orgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                className="gap-2 p-2"
                onClick={() => handleSetActive(org.id, org.slug)}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                  <Building2 className="size-3" />
                </div>
                <div className="grid flex-1">
                  <span className="truncate text-sm font-medium">
                    {org.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {org.slug}
                  </span>
                </div>
                {org.slug === slug && (
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    Aktif
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => router.push("/boarding")}
            >
              <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                <Plus className="size-3" />
              </div>
              <span className="text-sm font-medium">Buat Ruang Kerja Baru</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

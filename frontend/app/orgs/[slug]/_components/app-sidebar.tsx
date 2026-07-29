"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

import type * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { LogoWithText } from "@/components/logo/kreatur"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"

function getCachedLogos() {
  if (typeof window === "undefined") return { logoDark: null, logoLight: null }
  try {
    const stored = sessionStorage.getItem("kreatur-white-label")
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        logoDark: parsed.logoDark ?? null,
        logoLight: parsed.logoLight ?? null,
      }
    }
  } catch {}
  return { logoDark: null, logoLight: null }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [logoDark, setLogoDark] = useState<string | null>(null)
  const [logoLight, setLogoLight] = useState<string | null>(null)

  // Fetch white-label logos from cache or API
  useEffect(() => {
    const cached = getCachedLogos()
    if (cached.logoDark || cached.logoLight) {
      setLogoDark(cached.logoDark)
      setLogoLight(cached.logoLight)
      return
    }

    // Fetch from settings API
    if (!slug) return
    fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/api/orgs/${slug}/settings`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then((res: any) => {
        if (res?.success) {
          const wl = res.data.whiteLabel
          if (wl) {
            setLogoDark(wl.logoDark ?? null)
            setLogoLight(wl.logoLight ?? null)
            try {
              sessionStorage.setItem("kreatur-white-label", JSON.stringify(wl))
            } catch {}
          }
        }
      })
  }, [slug])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="-mt-px border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href={`/orgs/${slug}/dashboard`}>
                <LogoWithText logoDark={logoDark} logoLight={logoLight} />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

"use client"

import type { ReactNode } from "react"
import { notFound, useParams } from "next/navigation"

import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { AuthGuard } from "@/components/auth-guard"
import { authClient } from "@/lib/auth-client"

import { AccountSwitcher } from "./_components/account-switcher"
import { AppSidebar } from "./_components/app-sidebar"
import { SearchDialog } from "./_components/search-dialog"
import { ThemeSwitcher } from "./_components/theme-switcher"

function OrgMembershipGuard({ children }: { children: ReactNode }) {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const { data: orgs, isPending } = authClient.useListOrganizations()

  if (isPending) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (orgs && !orgs.some((o: { slug: string }) => o.slug === slug)) {
    notFound()
  }

  return <>{children}</>
}

export default function OrgLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <AuthGuard>
      <OrgMembershipGuard>
        <SidebarProvider
          defaultOpen={true}
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 68)",
            } as React.CSSProperties
          }
        >
          <AppSidebar />
          <SidebarInset
            className={cn(
              "peer-data-[variant=inset]:border",
              "[--dashboard-header-height:--spacing(12)]",
              "min-w-0 overflow-x-clip"
            )}
          >
            <header
              className={cn(
                "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
              )}
            >
              <div className="flex w-full items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-1 lg:gap-2">
                  <SidebarTrigger className="-ml-1" />
                  <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
                  />
                  <SearchDialog />
                </div>
                <div className="flex items-center gap-2">
                  <ThemeSwitcher />
                  <AccountSwitcher />
                </div>
              </div>
            </header>
            <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 has-data-[content-padding=false]:p-0 md:p-6 md:has-data-[content-padding=false]:p-0">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </OrgMembershipGuard>
    </AuthGuard>
  )
}

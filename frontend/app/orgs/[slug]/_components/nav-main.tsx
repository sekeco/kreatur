"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { Bell, ChevronRight, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

import { sidebarNavGroups, type NavItem } from "./sidebar-nav"
import { OrgSwitcher } from "./org-switcher"

export function NavMain() {
  const params = useParams<{ slug: string }>()
  const pathname = usePathname()
  const slug = params.slug

  const [userRole, setUserRole] = useState<string | null>(null)

  // Ambil role user di active organization
  useEffect(() => {
    authClient.organization.getActiveMemberRole({}).then(({ data }) => {
      if (data?.role) {
        // role bisa berupa string (tunggal) atau array (multiple roles)
        const raw = Array.isArray(data.role) ? data.role[0] : data.role
        const normalized = raw.toLowerCase()
        // Map "member" (Better Auth default) ke "contributor"
        setUserRole(normalized === "member" ? "contributor" : normalized)
      }
    })
  }, [slug])

  // Filter grup & item berdasarkan role
  const filteredGroups = sidebarNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true // no restriction
        if (!userRole) return false // role belum terload
        return item.roles.includes(userRole)
      }),
    }))
    .filter((group) => group.items.length > 0) // hapus grup kosong

  const isActive = (url: string) => {
    const fullUrl = `/orgs/${slug}${url}`
    if (url === "/dashboard") return pathname === fullUrl
    return pathname.startsWith(fullUrl)
  }

  const isSubItemActive = (url: string) => {
    return (
      pathname === `/orgs/${slug}${url}` ||
      pathname.startsWith(`/orgs/${slug}${url}?`)
    )
  }

  const hasSubItems = (
    item: NavItem
  ): item is NavItem & Required<Pick<NavItem, "subItems">> =>
    Boolean(item.subItems?.length)

  const isSubmenuOpen = (item: NavItem) => {
    if (!hasSubItems(item)) return false
    return item.subItems.some((sub) => isSubItemActive(sub.url))
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <OrgSwitcher />
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              {userRole &&
                ["owner", "editor", "reviewer", "contributor"].includes(
                  userRole
                ) && (
                  <SidebarMenuButton
                    asChild
                    tooltip="Buat Baru"
                    className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                  >
                    <Link prefetch={false} href={`/orgs/${slug}/articles/new`}>
                      <PlusIcon />
                      <span>Buat Artikel</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
                aria-label="Notifikasi"
              >
                <Bell />
                <span className="sr-only">Notifikasi</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {filteredGroups.map((group) => (
        <SidebarGroup key={group.id}>
          {group.label && (
            <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">
              {group.label}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavItemRenderer
                  key={item.id}
                  item={item}
                  slug={slug}
                  isActive={isActive}
                  isSubItemActive={isSubItemActive}
                  isSubmenuOpen={isSubmenuOpen}
                  hasSubItems={hasSubItems}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

function NavItemRenderer({
  item,
  slug,
  isActive,
  isSubItemActive,
  isSubmenuOpen,
  hasSubItems,
}: {
  item: NavItem
  slug: string
  isActive: (url: string) => boolean
  isSubItemActive: (url: string) => boolean
  isSubmenuOpen: (item: NavItem) => boolean
  hasSubItems: (
    item: NavItem
  ) => item is NavItem & Required<Pick<NavItem, "subItems">>
}) {
  const { state, isMobile } = useSidebar()
  const isCollapsedDesktop = state === "collapsed" && !isMobile

  if (!hasSubItems(item)) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive(item.url)}
          tooltip={item.title}
        >
          <Link prefetch={false} href={`/orgs/${slug}${item.url}`}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  if (isCollapsedDesktop) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={item.title} isActive={isActive(item.url)}>
          <item.icon />
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible
      asChild
      defaultOpen={isSubmenuOpen(item)}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive(item.url)}>
            <item.icon />
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.subItems.map((subItem) => (
              <SidebarMenuSubItem key={subItem.id}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isSubItemActive(subItem.url)}
                >
                  <Link prefetch={false} href={`/orgs/${slug}${subItem.url}`}>
                    <span>{subItem.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

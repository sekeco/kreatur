"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"

import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { sidebarNavGroups } from "./sidebar-nav"

type SearchItem = {
  id: string
  group: string
  label: string
  url: string
  icon?: React.ComponentType<{ className?: string }>
}

function flattenNavItems(): SearchItem[] {
  return sidebarNavGroups.flatMap((group) =>
    group.items.map((item) => ({
      id: item.id,
      group: group.label,
      label: item.title,
      url: item.url,
      icon: item.icon,
    }))
  )
}

const searchItems = flattenNavItems()

export function SearchDialog() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) setQuery("")
  }

  const handleSelect = (item: SearchItem) => {
    handleOpenChange(false)
    router.push(`/orgs/${slug}${item.url}`)
  }

  return (
    <>
      <Button
        onClick={() => handleOpenChange(true)}
        variant="link"
        className="px-0! font-normal text-muted-foreground hover:no-underline"
      >
        <Search data-icon="inline-start" />
        Cari apapun di sini ...
        <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium select-none">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <Command>
          <CommandInput
            placeholder="Cari menu atau artikel..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
            <CommandGroup heading="Navigasi">
              {searchItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.group} ${item.label}`}
                  onSelect={() => handleSelect(item)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {item.icon && <item.icon />}
                    <span className="truncate">{item.label}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

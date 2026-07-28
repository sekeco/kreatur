"use client"

import { CheckCircle, Loader2, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import type { SaveStatus } from "@/hooks/use-auto-save"

interface SaveIndicatorProps {
  status: SaveStatus
  className?: string
}

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  if (status === "idle") return null

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs transition-opacity",
        status === "saving" && "text-muted-foreground",
        status === "saved" && "text-emerald-600 dark:text-emerald-400",
        status === "error" && "text-red-600 dark:text-red-400",
        status === "unsaved" && "text-amber-600 dark:text-amber-400",
        className
      )}
    >
      {status === "saving" && (
        <>
          <Loader2 className="size-3 animate-spin" />
          <span>Menyimpan...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <CheckCircle className="size-3" />
          <span>Tersimpan</span>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="size-3" />
          <span>Gagal menyimpan</span>
        </>
      )}
      {status === "unsaved" && (
        <span className="text-muted-foreground">Belum disimpan</span>
      )}
    </div>
  )
}

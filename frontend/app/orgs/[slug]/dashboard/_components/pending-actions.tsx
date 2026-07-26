"use client"

import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface PendingActionItem {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  count: number
  href: string
}

export function PendingActions({
  items = [],
  title = "Perlu Tindakan",
  description = "Hal-hal yang memerlukan perhatian Anda.",
}: {
  items: PendingActionItem[]
  title?: string
  description?: string
}) {
  if (items.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.title}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              {item.count > 0 && (
                <Badge className="size-4 p-2">{item.count}</Badge>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

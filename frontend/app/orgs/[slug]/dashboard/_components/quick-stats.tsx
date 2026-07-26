"use client"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface QuickStatItem {
  label: string
  value: string
  sublabel?: string
}

export function QuickStats({
  items = [],
  title = "Ringkasan Cepat",
  description = "Statistik ruang kerja Anda saat ini.",
}: {
  items: QuickStatItem[]
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
      <div className="grid grid-cols-2 gap-4 px-(--card-spacing) pb-(--card-spacing)">
        {items.map((stat) => (
          <div key={stat.label} className="space-y-1 rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-medium">{stat.value}</p>
            {stat.sublabel && (
              <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

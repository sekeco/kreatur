"use client"

import {
  Clock,
  FileCheck,
  FileEdit,
  FileText,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  trend?: { direction: "up" | "down"; value: string }
  sublabel: string
  badge?: { label: string; className?: string }
}

function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  sublabel,
  badge,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
        </CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-3xl leading-none font-medium tracking-tight tabular-nums">
            {value}
          </div>
          {trend && (
            <Badge
              variant={trend.direction === "down" ? "destructive" : "default"}
            >
              {trend.direction === "up" ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {trend.value}
            </Badge>
          )}
          {badge && (
            <Badge variant="outline" className={badge.className}>
              {badge.label}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{sublabel}</p>
      </CardContent>
    </Card>
  )
}

export function MetricCards({
  totalArticles = 0,
  pendingReview = 0,
  draft = 0,
  published = 0,
}: {
  totalArticles?: number
  pendingReview?: number
  draft?: number
  published?: number
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        icon={FileText}
        label="Total Artikel"
        value={totalArticles.toLocaleString("id-ID")}
        sublabel="Sepanjang waktu"
      />
      <MetricCard
        icon={FileEdit}
        label="Perlu Review"
        value={pendingReview.toLocaleString("id-ID")}
        sublabel="Perlu tindakan segera"
        badge={{
          label: "Menunggu",
          className:
            "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
        }}
      />
      <MetricCard
        icon={Clock}
        label="Draft"
        value={draft.toLocaleString("id-ID")}
        sublabel="Belum dikirim ke review"
        badge={{
          label: "Draft",
          className:
            "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-400",
        }}
      />
      <MetricCard
        icon={FileCheck}
        label="Published"
        value={published.toLocaleString("id-ID")}
        sublabel="Sepanjang waktu"
      />
    </div>
  )
}

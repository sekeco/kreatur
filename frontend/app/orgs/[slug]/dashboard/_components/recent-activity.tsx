"use client"

import { CheckCircle2, FileEdit, FileText, Rocket, XCircle } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  TimelineHeader,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline"

interface ActivityItem {
  id: string
  eventType: string
  metadata?: string | null
  createdAt: string
  user: { id: string; name: string; image?: string | null }
  article: { id: string; title: string }
}

function getEventLabel(eventType: string) {
  const labels: Record<string, string> = {
    CREATED: "Artikel dibuat",
    SUBMITTED: "Artikel diajukan",
    UPDATED: "Konten diperbarui",
    APPROVED: "Artikel disetujui",
    REVISION_REQUESTED: "Revisi diminta",
    REJECTED: "Artikel ditolak",
    PUBLISHED: "Artikel diterbitkan",
    ARCHIVED: "Artikel diarsipkan",
    DELETED: "Artikel dihapus",
  }
  return labels[eventType] ?? eventType
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case "CREATED":
    case "SUBMITTED":
      return FileText
    case "UPDATED":
    case "REVISION_REQUESTED":
      return FileEdit
    case "APPROVED":
      return CheckCircle2
    case "REJECTED":
      return XCircle
    case "PUBLISHED":
      return Rocket
    default:
      return FileText
  }
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return "Baru saja"
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  if (diff < 172800) return "Kemarin"
  return `${Math.floor(diff / 86400)} hari lalu`
}

export function RecentActivity({ events = [] }: { events: ActivityItem[] }) {
  const items = events.slice(0, 6).map((e) => ({
    id: e.id,
    dateTime: e.createdAt,
    date: timeAgo(e.createdAt),
    title: getEventLabel(e.eventType),
    description: `${e.article?.title ?? "Artikel"} oleh ${e.user.name}`,
    icon: getEventIcon(e.eventType),
  }))
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Aktivitas Terbaru</CardTitle>
        <CardDescription>
          Riwayat aktivitas di ruang kerja Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Timeline className="[--timeline-dot-size:1.75rem]">
          {items.map((item) => (
            <TimelineItem key={item.id} className="pb-0">
              <TimelineDot>
                <item.icon className="size-3.5" />
              </TimelineDot>
              <TimelineConnector />
              <TimelineContent>
                <TimelineHeader>
                  <TimelineTime dateTime={item.dateTime}>
                    {item.date}
                  </TimelineTime>
                  <TimelineTitle>{item.title}</TimelineTitle>
                </TimelineHeader>
                <TimelineDescription>{item.description}</TimelineDescription>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  )
}

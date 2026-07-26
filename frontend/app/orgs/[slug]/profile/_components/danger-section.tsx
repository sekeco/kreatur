"use client"

import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function DangerSection() {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle>Zona Berbahaya</CardTitle>
        <CardDescription>
          Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
          <div>
            <p className="text-sm font-medium">Hapus Akun</p>
            <p className="text-xs text-muted-foreground">
              Hapus akun Anda dan semua data terkait secara permanen.
            </p>
          </div>
          <Button variant="destructive" disabled>
            <TriangleAlert data-icon="inline-start" />
            Hapus Akun
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

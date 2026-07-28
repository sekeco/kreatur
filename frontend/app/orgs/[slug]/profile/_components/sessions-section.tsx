"use client"

import * as React from "react"
import { CheckCircle2, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/eden-client"
import { getErrorMessage } from "@/lib/utils"
import type { ProfileData } from "./types"

interface Props {
  sessions: ProfileData["sessions"]
  slug: string
}

export function SessionsSection({ sessions, slug }: Props) {
  const [revoking, setRevoking] = React.useState<string | null>(null)
  const router = useRouter()

  async function handleRevoke(token: string, isCurrent: boolean) {
    setRevoking(token)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .profile.sessions({ token })
        .delete()
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mencabut sesi")
      } else {
        toast.success("Sesi berhasil dicabut")
        if (isCurrent) {
          await authClient.signOut()
          router.push("/auth/signin")
        }
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setRevoking(null)
    }
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sesi Aktif</CardTitle>
          <CardDescription>
            Perangkat yang sedang login ke akun Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Tidak ada sesi aktif.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sesi Aktif</CardTitle>
        <CardDescription>
          Perangkat yang sedang login ke akun Anda. Cabut sesi yang tidak
          dikenal.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="[&_th]:px-4!">
              <TableHead>Perangkat</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.token} className="[&_td]:px-4">
                <TableCell className="min-w-40 font-medium">
                  {s.userAgent ? (
                    <span className="truncate text-wrap">{s.userAgent}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      Perangkat tidak dikenal
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.ipAddress ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(s.createdAt).toLocaleDateString("id-ID", {
                    dateStyle: "medium",
                  })}
                </TableCell>
                <TableCell>
                  {s.isCurrent ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 data-icon="inline-start" />
                      Saat Ini
                    </Badge>
                  ) : (
                    <Badge variant="outline">Aktif</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive"
                    disabled={revoking === s.token}
                    onClick={() => handleRevoke(s.token, s.isCurrent)}
                  >
                    {revoking === s.token ? (
                      "Memproses..."
                    ) : (
                      <LogOut className="size-4" />
                    )}
                    <span className="sr-only">Cabut sesi</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

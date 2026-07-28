"use client"

import * as React from "react"
import { Copy, ExternalLink, Save, UserCheck } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/eden-client"
import { getErrorMessage, getInitials } from "@/lib/utils"
import type { PreferencesData } from "./types"

interface MemberOption {
  id: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

interface Props {
  preferences: PreferencesData
  slug: string
}

export function PreferencesSection({ preferences, slug }: Props) {
  // Convert 0-100 from API to 1-5 for display
  const [defaultScoreForPublish, setDefaultScoreForPublish] = React.useState(
    preferences.defaultScoreForPublish
      ? Math.round(preferences.defaultScoreForPublish / 20).toString()
      : ""
  )
  const [defaultReviewerId, setDefaultReviewerId] = React.useState(
    preferences.defaultReviewerId ?? ""
  )
  const [members, setMembers] = React.useState<MemberOption[]>([])
  const [userRole, setUserRole] = React.useState<string | null>(null)
  const [publicJoinEnabled, setPublicJoinEnabled] = React.useState(
    preferences.publicJoinEnabled
  )
  const [saving, setSaving] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${slug}`
      : `/join/${slug}`

  React.useEffect(() => {
    setDefaultScoreForPublish(
      preferences.defaultScoreForPublish
        ? Math.round(preferences.defaultScoreForPublish / 20).toString()
        : ""
    )
    setDefaultReviewerId(preferences.defaultReviewerId ?? "")
    setPublicJoinEnabled(preferences.publicJoinEnabled)
  }, [preferences])

  // Fetch members + current user role
  React.useEffect(() => {
    if (!slug) return
    api.api
      .orgs({ slug })
      .members.get()
      .then(({ data }) => {
        if (data?.success) {
          const raw = data.data
          const list = Array.isArray(raw) ? raw : (raw?.members ?? [])
          setMembers(
            list.filter((m: MemberOption) =>
              ["reviewer", "editor", "owner"].includes(m.role)
            )
          )
        }
      })
    // Get current user role
    import("@/lib/auth-client").then(({ authClient }) => {
      authClient.organization.getActiveMemberRole({}).then(({ data }) => {
        if (data?.role) {
          const raw = Array.isArray(data.role) ? data.role[0] : data.role
          setUserRole(
            raw.toLowerCase() === "member" ? "contributor" : raw.toLowerCase()
          )
        }
      })
    })
  }, [slug])

  async function handleSave() {
    const score =
      defaultScoreForPublish.trim() !== ""
        ? Number(defaultScoreForPublish)
        : null
    if (score !== null && (isNaN(score) || score < 1 || score > 5)) {
      toast.error("Skor minimal publish harus antara 1–5")
      return
    }
    // Convert 1-5 to 0-100 for API
    const apiScore = score !== null ? score * 20 : null

    setSaving(true)
    try {
      const { error } = await api.api.orgs({ slug }).settings.preferences.put({
        defaultScoreForPublish: apiScore,
        defaultReviewerId: defaultReviewerId || null,
        publicJoinEnabled,
      })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal menyimpan preferensi")
      } else {
        toast.success("Preferensi workspace berhasil diperbarui!")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleCopyJoinUrl() {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Tautan berhasil disalin!")
    } catch {
      toast.error("Gagal menyalin tautan")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferensi Workspace</CardTitle>
        <CardDescription>
          Atur preferensi dan tautan bergabung ruang kerja Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="default-score">
              Skor Minimal untuk Publikasi Otomatis
            </FieldLabel>
            <Input
              id="default-score"
              type="number"
              min={1}
              max={5}
              step={1}
              placeholder="Contoh: 4"
              value={defaultScoreForPublish}
              onChange={(e) => setDefaultScoreForPublish(e.target.value)}
            />
            <FieldDescription>
              Artikel dengan skor review ≥ nilai ini akan otomatis diterbitkan.
              Nilai 1–5 (★), kosongkan untuk nonaktif. Default: 4
            </FieldDescription>
          </Field>

          {userRole === "owner" && (
            <Field>
              <FieldLabel htmlFor="default-reviewer">
                Reviewer Default
              </FieldLabel>
              <Select
                value={defaultReviewerId}
                onValueChange={setDefaultReviewerId}
              >
                <SelectTrigger id="default-reviewer" className="w-full">
                  <SelectValue placeholder="Pilih reviewer default..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Otomatis (Owner)</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.user.id}>
                      <span className="flex items-center gap-2">
                        <Avatar className="size-5">
                          <AvatarImage
                            src={m.user?.image ?? undefined}
                            alt={m.user?.name}
                          />
                          <AvatarFallback className="text-[8px]">
                            {getInitials(m.user?.name ?? "")}
                          </AvatarFallback>
                        </Avatar>
                        {m.user?.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Reviewer yang akan ditugaskan secara otomatis saat kontributor
                submit artikel. Pilih kosong untuk menggunakan Owner sebagai
                default.
              </FieldDescription>
            </Field>
          )}
        </FieldGroup>
        <Field>
          <FieldLabel>Tautan Bergabung Publik</FieldLabel>
          <FieldDescription>
            Bagikan tautan ini agar siapa pun dapat mendaftar dan bergabung
            sebagai Kontributor ke ruang kerja Anda.
          </FieldDescription>
          <div className="flex items-center gap-2">
            <Input value={joinUrl} readOnly className="flex-1 text-sm" />
            <Button
              variant="outline"
              onClick={handleCopyJoinUrl}
              className="shrink-0"
            >
              <Copy className="size-4" />
              Salin
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(joinUrl, "_blank")}
              className="shrink-0"
            >
              <ExternalLink className="size-4" />
            </Button>
          </div>
          <Field orientation="horizontal" className="gap-2">
            <Checkbox
              id="public-join"
              checked={publicJoinEnabled}
              onCheckedChange={(checked) =>
                setPublicJoinEnabled(Boolean(checked))
              }
            />
            <FieldContent>
              <FieldLabel htmlFor="public-join" className="text-sm font-normal">
                Buka Halaman Bergabung
              </FieldLabel>
            </FieldContent>
          </Field>
        </Field>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave} disabled={saving}>
          <Save data-icon="inline-start" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </CardFooter>
    </Card>
  )
}

"use client"

import * as React from "react"
import { Copy, ExternalLink, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

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
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/eden-client"
import { getErrorMessage } from "@/lib/utils"
import type { PreferencesData } from "./types"

interface Props {
  preferences: PreferencesData
  slug: string
}

export function PreferencesSection({ preferences, slug }: Props) {
  const [defaultScoreForPublish, setDefaultScoreForPublish] = React.useState(
    preferences.defaultScoreForPublish?.toString() ?? ""
  )
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
      preferences.defaultScoreForPublish?.toString() ?? ""
    )
    setPublicJoinEnabled(preferences.publicJoinEnabled)
  }, [preferences])

  async function handleSave() {
    const score =
      defaultScoreForPublish.trim() !== ""
        ? Number(defaultScoreForPublish)
        : null
    if (score !== null && (isNaN(score) || score < 0 || score > 100)) {
      toast.error("Skor minimal publish harus antara 0–100")
      return
    }

    setSaving(true)
    try {
      const { error } = await api.api.orgs({ slug }).settings.preferences.put({
        defaultScoreForPublish: score,
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
              min={0}
              max={100}
              placeholder="Kosongkan untuk nonaktif"
              value={defaultScoreForPublish}
              onChange={(e) => setDefaultScoreForPublish(e.target.value)}
            />
            <FieldDescription>
              Artikel dengan skor review di atas nilai ini akan otomatis
              diterbitkan. Biarkan kosong jika tidak ingin menggunakan fitur
              ini.
            </FieldDescription>
          </Field>
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

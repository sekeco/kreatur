"use client"

import * as React from "react"
import { Save } from "lucide-react"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/eden-client"
import { getErrorMessage } from "@/lib/utils"
import type { WorkspaceData } from "./types"

interface Props {
  workspace: WorkspaceData
  slug: string
  onUpdated: () => void
}

export function ProfileSection({ workspace, slug, onUpdated }: Props) {
  const [name, setName] = React.useState(workspace.name)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setName(workspace.name)
  }, [workspace.name])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .settings.profile.put({ name: name.trim() })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal menyimpan profil")
      } else {
        toast.success("Profil workspace berhasil diperbarui!")
        onUpdated()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Workspace</CardTitle>
        <CardDescription>
          Nama dan informasi dasar ruang kerja Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="ws-name">Nama Workspace</FieldLabel>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="ws-slug">Slug</FieldLabel>
            <Input id="ws-slug" value={workspace.slug} disabled />
            <p className="text-xs text-muted-foreground">
              Slug tidak dapat diubah saat ini.
            </p>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave} disabled={!name.trim() || saving}>
          <Save data-icon="inline-start" />
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </CardFooter>
    </Card>
  )
}

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
import type { PayoutRulesData } from "./types"

interface Props {
  payoutRules: PayoutRulesData
  slug: string
}

export function HonorSection({ payoutRules, slug }: Props) {
  const [defaultHonor, setDefaultHonor] = React.useState(
    payoutRules.defaultHonor.toString()
  )
  const [minPayout, setMinPayout] = React.useState(
    payoutRules.minPayout.toString()
  )
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setDefaultHonor(payoutRules.defaultHonor.toString())
    setMinPayout(payoutRules.minPayout.toString())
  }, [payoutRules.defaultHonor, payoutRules.minPayout])

  async function handleSave() {
    const dh = Number(defaultHonor)
    const mp = Number(minPayout)
    if (isNaN(dh) || dh < 0) {
      toast.error("Nominal honor default tidak valid")
      return
    }
    if (isNaN(mp) || mp < 0) {
      toast.error("Nominal minimal payout tidak valid")
      return
    }
    setSaving(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        ["payout-rules"].put({ defaultHonor: dh, minPayout: mp })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal menyimpan aturan honor")
      } else {
        toast.success("Aturan honor berhasil diperbarui!")
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
        <CardTitle>Aturan Honor</CardTitle>
        <CardDescription>
          Atur nominal default honor dan batas minimal pencairan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="default-honor">
              Honor Default per Artikel (Rp)
            </FieldLabel>
            <Input
              id="default-honor"
              type="number"
              min={0}
              step={1000}
              value={defaultHonor}
              onChange={(e) => setDefaultHonor(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="min-payout">Minimal Payout (Rp)</FieldLabel>
            <Input
              id="min-payout"
              type="number"
              min={0}
              step={1000}
              value={minPayout}
              onChange={(e) => setMinPayout(e.target.value)}
            />
          </Field>
        </FieldGroup>
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

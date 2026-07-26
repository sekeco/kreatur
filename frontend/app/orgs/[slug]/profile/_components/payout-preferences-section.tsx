"use client"

import * as React from "react"
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
import type { ProfileData } from "./types"

interface Props {
  data: ProfileData
  slug: string
  onUpdated: () => void
}

export function PayoutPreferencesSection({ data, slug, onUpdated }: Props) {
  const [bankName, setBankName] = React.useState(data.profile.bankName ?? "")
  const [bankAccountNumber, setBankAccountNumber] = React.useState(
    data.profile.bankAccountNumber ?? ""
  )
  const [bankAccountName, setBankAccountName] = React.useState(
    data.profile.bankAccountName ?? ""
  )
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setBankName(data.profile.bankName ?? "")
    setBankAccountNumber(data.profile.bankAccountNumber ?? "")
    setBankAccountName(data.profile.bankAccountName ?? "")
  }, [data.profile])

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await api.api.orgs({ slug }).profile.put({
        bankName: bankName.trim() || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankAccountName: bankAccountName.trim() || undefined,
      })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal menyimpan preferensi")
      } else {
        toast.success("Preferensi payout berhasil disimpan!")
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
        <CardTitle>Preferensi Payout</CardTitle>
        <CardDescription>
          Data bank default untuk pencairan honor. Akan terisi otomatis saat
          mengajukan payout.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="bank-name">Nama Bank</FieldLabel>
            <Input
              id="bank-name"
              placeholder="Contoh: Bank Mandiri"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="bank-account-number">Nomor Rekening</FieldLabel>
            <Input
              id="bank-account-number"
              placeholder="Contoh: 1234567890"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="bank-account-name">Nama Pemilik Rekening</FieldLabel>
            <Input
              id="bank-account-name"
              placeholder="Contoh: JOHN DOE"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
            />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </CardFooter>
    </Card>
  )
}

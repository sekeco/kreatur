"use client"

import { Loader2, Wallet } from "lucide-react"
import { useParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/eden-client"
import { getErrorMessage } from "@/lib/utils"

interface EligibleArticle {
  id: string
  title: string
  honor: number
  status: string
}

export function RequestPayoutDialog({
  onPayoutCreated,
}: {
  onPayoutCreated?: () => void
}) {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // Form state
  const [bankName, setBankName] = React.useState("")
  const [bankAccountNumber, setBankAccountNumber] = React.useState("")
  const [bankAccountName, setBankAccountName] = React.useState("")

  // Articles state
  const [articles, setArticles] = React.useState<EligibleArticle[]>([])
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  // Fetch eligible articles + bank data from profile when dialog opens
  React.useEffect(() => {
    if (!open || !slug) return

    let cancelled = false
    setLoading(true)

    async function fetchData() {
      const session = await authClient.getSession()
      const userId = session?.data?.user?.id
      if (!userId || cancelled) return

      const [articlesRes, profileRes] = await Promise.all([
        api.api.orgs({ slug }).payouts["eligible-articles"].get({
          query: { authorId: userId },
        }),
        api.api.orgs({ slug }).profile.get(),
      ])

      if (cancelled) return

      // Pre-fill bank data from user profile
      const profile = profileRes.data?.data?.profile
      if (profile) {
        setBankName(profile.bankName ?? "")
        setBankAccountNumber(profile.bankAccountNumber ?? "")
        setBankAccountName(profile.bankAccountName ?? "")
      }

      // Set eligible articles (backend sudah filter yg belum punya payout aktif)
      const articles = ((articlesRes.data as any)?.data ??
        []) as EligibleArticle[]
      setArticles(articles)
      setLoading(false)
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [open, slug])

  const totalAmount = React.useMemo(() => {
    return articles
      .filter((a) => selectedIds.has(a.id))
      .reduce((sum, a) => sum + (a.honor ?? 0), 0)
  }, [articles, selectedIds])

  function toggleArticle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit() {
    if (
      !bankName.trim() ||
      !bankAccountNumber.trim() ||
      !bankAccountName.trim()
    ) {
      toast.error("Lengkapi data bank terlebih dahulu")
      return
    }
    if (selectedIds.size === 0) {
      toast.error("Pilih minimal satu artikel")
      return
    }

    setSubmitting(true)
    try {
      const session = await authClient.getSession()
      const contributorId = session?.data?.user?.id
      if (!contributorId) {
        toast.error("Sesi tidak ditemukan")
        return
      }

      const { error } = await api.api.orgs({ slug }).payouts.post({
        contributorId,
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountName: bankAccountName.trim(),
        articleIds: Array.from(selectedIds),
      })

      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengajukan pencairan")
        return
      }

      toast.success("Pengajuan pencairan berhasil dikirim!")
      setOpen(false)
      resetForm()
      onPayoutCreated?.()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setBankName("")
    setBankAccountNumber("")
    setBankAccountName("")
    setSelectedIds(new Set())
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Wallet data-icon="inline-start" />
          Ajukan Pencairan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajukan Pencairan Honor</DialogTitle>
          <DialogDescription>
            Pilih artikel yang sudah disetujui dan isi data bank untuk pencairan
            honor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data Bank */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Data Bank</h4>
            <p className="text-xs text-muted-foreground">
              Data bank diisi otomatis dari profil. Isi di halaman profil jika
              belum ada.{" "}
              <a
                href={`/orgs/${slug}/profile`}
                className="underline underline-offset-2 hover:text-foreground"
              >
                Ubah di profil
              </a>
            </p>
            <Field>
              <FieldLabel htmlFor="bank-name">Nama Bank</FieldLabel>
              <Input
                id="bank-name"
                placeholder="BCA, Mandiri, BNI..."
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </Field>
            <div className="flex gap-3">
              <Field className="flex-1">
                <FieldLabel htmlFor="bank-account-number">
                  No. Rekening
                </FieldLabel>
                <Input
                  id="bank-account-number"
                  placeholder="1234567890"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                />
              </Field>
              <Field className="flex-1">
                <FieldLabel htmlFor="bank-account-name">
                  Nama Pemilik
                </FieldLabel>
                <Input
                  id="bank-account-name"
                  placeholder="Sesuai rekening"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                />
              </Field>
            </div>
          </div>

          <Separator />

          {/* Pilih Artikel */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Pilih Artikel</h4>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Memuat artikel...
                </span>
              </div>
            ) : articles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada artikel yang bisa diajukan. Semua artikel yang sudah
                disetujui mungkin sudah memiliki pengajuan pencairan aktif.
              </p>
            ) : (
              <div className="max-h-60 space-y-1 overflow-y-auto">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`article-${article.id}`}
                      checked={selectedIds.has(article.id)}
                      onCheckedChange={() => toggleArticle(article.id)}
                    />
                    <label
                      htmlFor={`article-${article.id}`}
                      className="flex flex-1 cursor-pointer items-center gap-3"
                    >
                      <span className="flex-1 truncate">{article.title}</span>
                      <span className="text-muted-foreground tabular-nums">
                        Rp{(article.honor ?? 0).toLocaleString("id-ID")}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2">
              <span className="text-sm font-medium">Total</span>
              <span className="text-lg font-bold tabular-nums">
                Rp{totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            Ajukan Pencairan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  FileEdit,
  FileText,
  ImageIcon,
  InfoIcon,
  Pencil,
  Rocket,
  Save,
  Send,
  SendHorizontal,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Rating, RatingItem } from "@/components/ui/rating"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const TipTapEditor = dynamic(
  () => import("@/components/tiptap-editor").then((mod) => mod.TipTapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[250px] items-center justify-center rounded-lg border border-input">
        <span className="text-sm text-muted-foreground">Memuat editor…</span>
      </div>
    ),
  }
)

import { type ArticleStatus, ArticleStatusLabel } from "@kreatur/commons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
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
import { Toggle } from "@/components/ui/toggle"
import { authClient } from "@/lib/auth-client"
import { Breadcrumb } from "@/components/breadcrumb-nav"
import { api } from "@/lib/eden-client"
import { cn, getErrorMessage } from "@/lib/utils"
import { statusMeta } from "../../_components/article-data"
import { AuthorProfileCard } from "./_components/author-profile-card"

// ─── Types ──────────────────────────────────────────────

interface CategoryItem {
  id: string
  name: string
  slug: string
  color: string
}

interface ArticleReviewEvent {
  id: string
  eventType: string
  metadata?: string | null
  createdAt: string | Date
  user: { id: string; name: string; email: string; image?: string | null }
}

interface ArticleReviewItem {
  id: string
  score?: number
  notes?: string
  decision: string
  createdAt: string
  reviewer: { id: string; name: string; email: string; image?: string }
}

interface MemberItem {
  id: string
  role: string
  user: { id: string; name: string; email: string; image?: string | null }
}

function isEditable(status: string) {
  return (
    status === "DRAFT" ||
    status === "PENDING_REVIEW" ||
    status === "REVISION_REQUESTED"
  )
}

function isReadOnly(status: string) {
  return (
    status === "PUBLISHED" || status === "ARCHIVED" || status === "REJECTED"
  )
}

// ─── Event Helpers ──────────────────────────────────────

function toProperCase(str: string) {
  return str
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case "CREATED":
      return FileText
    case "SUBMITTED":
      return SendHorizontal
    case "UPDATED":
      return FileEdit
    case "APPROVED":
      return CheckCircle2
    case "REVISION_REQUESTED":
      return FileEdit
    case "REJECTED":
      return XCircle
    case "PUBLISHED":
      return Rocket
    case "ARCHIVED":
      return Archive
    case "DELETED":
      return Trash2
    default:
      return FileText
  }
}

function getEventLabel(eventType: string) {
  const labels: Record<string, string> = {
    CREATED: "Artikel dibuat",
    SUBMITTED: "Disubmit untuk review",
    UPDATED: "Konten diperbarui",
    APPROVED: "Artikel disetujui",
    REVISION_REQUESTED: "Revisi diminta",
    REJECTED: "Artikel ditolak",
    PUBLISHED: "Artikel diterbitkan",
    ARCHIVED: "Artikel diarsipkan",
    DELETED: "Artikel dihapus",
  }
  return labels[eventType] ?? toProperCase(eventType)
}

function parseEventMetadata(metadata: string | null | undefined): {
  score?: number
  notes?: string
} | null {
  if (!metadata) return null
  try {
    return JSON.parse(metadata)
  } catch {
    return null
  }
}

// ─── Page Component ─────────────────────────────────────

export default function ArticleReviewPage() {
  const params = useParams<{ slug: string; id: string }>()
  const router = useRouter()
  const slug = params.slug
  const id = params.id

  // ── Role state & guard ──
  const [userRole, setUserRole] = React.useState<string | null>(null)
  React.useEffect(() => {
    authClient.organization.getActiveMemberRole({}).then(({ data }) => {
      if (data?.role) {
        const raw = Array.isArray(data.role) ? data.role[0] : data.role
        const role =
          raw.toLowerCase() === "member" ? "contributor" : raw.toLowerCase()
        setUserRole(role)
        if (role === "contributor") {
          router.replace(`/orgs/${slug}/articles/${id}`)
        }
      }
    })
  }, [slug, id, router])

  // ── Data state ──
  const [articleData, setArticleData] = React.useState<any>(null)
  const [categories, setCategories] = React.useState<CategoryItem[]>([])
  const [events, setEvents] = React.useState<ArticleReviewEvent[]>([])
  const [members, setMembers] = React.useState<MemberItem[]>([])
  const [loadingPage, setLoadingPage] = React.useState(true)

  // ── Form state ──
  const [title, setTitle] = React.useState("")
  const [excerpt, setExcerpt] = React.useState("")
  const [content, setContent] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [editingContent, setEditingContent] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  // ── Review state ──
  const [score, setScore] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [honorAmount, setHonorAmount] = React.useState("")
  const [autoPublishScore, setAutoPublishScore] = React.useState(4) // default 4 (dari 80/20)
  const [settingsDefaultHonor, setSettingsDefaultHonor] = React.useState(50000) // default dari workspace_preferences

  // ── Submit state ──

  // ── Dialog state ──
  const [confirmDialog, setConfirmDialog] = React.useState<
    "approve" | "reject" | "revision" | "publish" | "archive" | "submit" | null
  >(null)
  const [loading, setLoading] = React.useState(false)

  // ── Fetch data ──
  React.useEffect(() => {
    if (!slug || !id) return
    Promise.all([
      api.api.orgs({ slug }).articles({ id }).get(),
      api.api.orgs({ slug }).categories.get({ query: { pageSize: "100" } }),
      api.api.orgs({ slug }).articles({ id }).events.get(),
      api.api.orgs({ slug }).members.get(),
      api.api.orgs({ slug }).settings.get(),
    ])
      .then(([articleRes, catRes, eventsRes, membersRes, settingsRes]) => {
        if (articleRes.data?.success) {
          const a = articleRes.data.data
          setArticleData(a)
          setTitle(a.title ?? "")
          setExcerpt(a.excerpt ?? "")
          setContent(a.content ?? "")
          setCategory(a.categoryId ?? "")
          setHonorAmount(a.honor?.toString() ?? defaultHonor ?? "")
        }
        if (catRes.data?.success && Array.isArray(catRes.data.data)) {
          setCategories(catRes.data.data)
        }
        if (eventsRes.data?.success && Array.isArray(eventsRes.data.data)) {
          setEvents(eventsRes.data.data)
        }
        if (membersRes.data?.success) {
          const raw = membersRes.data.data
          if (Array.isArray(raw)) {
            setMembers(raw)
          } else if (raw?.members && Array.isArray(raw.members)) {
            setMembers(raw.members)
          }
        }
        // Ambil auto-publish threshold & default honor dari preferences workspace
        if (settingsRes.data?.success) {
          const s = settingsRes.data.data as any
          if (s?.preferences?.defaultScoreForPublish != null) {
            // Konversi 0-100 ke 1-5 (sama seperti settings page)
            setAutoPublishScore(
              Math.round(s.preferences.defaultScoreForPublish / 20)
            )
          }
          if (s?.payoutRules?.defaultHonor != null) {
            setSettingsDefaultHonor(s.payoutRules.defaultHonor)
          }
        }
      })
      .finally(() => setLoadingPage(false))
  }, [slug, id])

  // ── Derived values ──
  const article = articleData
  const scoreNum = Number(score)
  const status = article?.status as ArticleStatus | undefined
  const statusMetaData = status
    ? (statusMeta[status] ?? statusMeta.DRAFT)
    : statusMeta.DRAFT
  // Prioritas: honor dari artikel (sudah diassign), fallback ke default workspace
  const defaultHonor = article?.honor ?? settingsDefaultHonor
  const readonly = status ? isReadOnly(status) : false
  const editable = status ? isEditable(status) : false

  // Events
  const submittedEvent = events.find(
    (e) => e.eventType === "SUBMITTED" || e.eventType === "CREATED"
  )
  const reviewEvents = events.filter(
    (e) =>
      e.eventType === "APPROVED" ||
      e.eventType === "REVISION_REQUESTED" ||
      e.eventType === "REJECTED"
  )
  const firstReview: ArticleReviewItem | undefined =
    article?.reviews?.[article.reviews.length - 1]

  // Author
  const authorName = article?.author?.name ?? "Penulis"
  const authorEmail = article?.author?.email ?? ""
  const authorImage = article?.author?.image ?? ""

  // Auto-publish (skala 1-5, dari preferences workspace)
  const willAutoPublish = !isNaN(scoreNum) && scoreNum >= autoPublishScore

  // ── Handlers ──

  // Review
  function handleReviewAction(action: "approve" | "reject" | "revision") {
    if (!score || isNaN(scoreNum) || scoreNum < 1 || scoreNum > 5) {
      toast.error("Pilih skor yang valid (1–5)")
      return
    }
    if (action === "reject" && !notes.trim()) {
      toast.error("Alasan penolakan wajib diisi")
      return
    }
    setConfirmDialog(action)
  }

  async function confirmReview() {
    setLoading(true)
    try {
      const decision =
        confirmDialog === "approve"
          ? "APPROVED"
          : confirmDialog === "reject"
            ? "REJECTED"
            : "REVISION_REQUESTED"
      // Convert 1-5 scale to 0-100 for API
      const apiScore = scoreNum * 20
      const honorValue =
        String(honorAmount).trim() !== "" ? Number(honorAmount) : undefined
      const { error } = await api.api
        .orgs({ slug })
        .articles({ id })
        .review.post({
          decision,
          score: apiScore,
          notes: notes || undefined,
          honor:
            honorValue != null && !isNaN(honorValue) ? honorValue : undefined,
        })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal memproses review")
      } else {
        toast.success(
          confirmDialog === "approve"
            ? "Artikel berhasil disetujui!"
            : confirmDialog === "reject"
              ? "Artikel ditolak."
              : "Revisi diminta pada artikel."
        )
        setConfirmDialog(null)
        router.push(`/orgs/${slug}/articles`)
        router.refresh()
      }
    } catch (error) {
      console.log(error)
      toast.error("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  // Save changes (Perbarui Konten)
  async function handleSaveChanges() {
    setSaving(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .articles({ id })
        .put({
          title: title.trim(),
          excerpt: excerpt || undefined,
          content: content || undefined,
          categoryId: category || null,
        })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal menyimpan perubahan")
      } else {
        toast.success("Perubahan berhasil disimpan")
        router.refresh()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  // Submit for review
  function handleSubmitForReview() {
    setConfirmDialog("submit")
  }

  async function confirmSubmit() {
    setLoading(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .articles({ id })
        .submit.post({})
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal submit artikel")
      } else {
        toast.success("Artikel berhasil disubmit untuk review!")
        setConfirmDialog(null)
        router.push(`/orgs/${slug}/articles`)
        router.refresh()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  // Publish
  function handlePublish() {
    setConfirmDialog("publish")
  }

  async function confirmPublish() {
    setLoading(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .articles({ id })
        .publish.post()
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal menerbitkan artikel")
      } else {
        toast.success("Artikel berhasil diterbitkan!")
        setConfirmDialog(null)
        router.push(`/orgs/${slug}/articles`)
        router.refresh()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  // Archive
  function handleArchive() {
    setConfirmDialog("archive")
  }

  async function confirmArchive() {
    setLoading(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .articles({ id })
        .archive.post()
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal mengarsipkan artikel")
      } else {
        toast.success("Artikel berhasil diarsipkan!")
        setConfirmDialog(null)
        router.push(`/orgs/${slug}/articles`)
        router.refresh()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  // ── Loading state ──
  if (loadingPage) {
    return (
      <div className="@container/main flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-sm text-muted-foreground">Memuat artikel...</p>
      </div>
    )
  }

  // ── Not found state ──
  if (!articleData) {
    return (
      <div className="@container/main flex flex-col items-center justify-center gap-4 py-24">
        <h1 className="text-2xl font-medium">Artikel tidak ditemukan</h1>
        <p className="text-sm text-muted-foreground">
          Artikel dengan ID &quot;{id}&quot; tidak ada.
        </p>
        <Button variant="outline" asChild>
          <Link href={`/orgs/${slug}/articles`}>
            <ArrowLeft /> Kembali
          </Link>
        </Button>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────

  // Hanya tampilkan toggle edit jika editable dan bukan finance
  const showEditToggle = editable && userRole !== "finance"

  return (
    <div className="@container/main space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="-ms-1.5 flex items-start gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/orgs/${slug}/articles`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <Breadcrumb
            items={[
              { label: "Artikel", href: `/orgs/${slug}/articles` },
              { label: article.title, href: `/orgs/${slug}/articles/${id}` },
              { label: "Review" },
            ]}
            className="mb-1"
          />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-medium">{article.title}</h1>
            <Badge
              className={cn(
                "gap-1.5 border px-2 py-1 font-medium",
                statusMetaData.badgeClass
              )}
              variant="outline"
            >
              <span
                className={cn("size-1.5 rounded-full", statusMetaData.dotClass)}
              />
              {status ? ArticleStatusLabel[status] : ""}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {editable
              ? "Perbarui konten dan informasi artikel"
              : readonly
                ? "Artikel dalam mode baca-saja"
                : "Review & edit konten artikel"}
          </p>
        </div>
      </div>

      {/* ── Latest Review Alert ── */}
      {firstReview && (
        <Alert
          variant={
            firstReview.decision === "APPROVED" ? "default" : "destructive"
          }
        >
          {firstReview.decision === "APPROVED" ? (
            <CheckCircle className="size-4" />
          ) : (
            <XCircle className="size-4" />
          )}
          <AlertTitle>
            {firstReview.decision === "APPROVED"
              ? "Artikel disetujui"
              : firstReview.decision === "REJECTED"
                ? "Artikel ditolak"
                : "Revisi diminta"}
          </AlertTitle>
          <AlertDescription>
            {firstReview.score !== null && firstReview.score !== undefined && (
              <span>Skor: {Math.round(firstReview.score / 20)}/5 ★</span>
            )}
            {firstReview.notes && <> &middot; {firstReview.notes}</>}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left Column ────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* ── Content / Editor ── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Konten Artikel</CardTitle>
              <div className="flex items-center gap-2">
                {!readonly && (
                  <Button
                    variant="outline"
                    onClick={handleSaveChanges}
                    disabled={saving}
                  >
                    <Save data-icon="inline-start" />
                    {saving ? "Menyimpan..." : "Perbarui Konten"}
                  </Button>
                )}
                {showEditToggle && (
                  <Toggle
                    pressed={editingContent}
                    onPressedChange={setEditingContent}
                    aria-label="Edit konten"
                  >
                    <Pencil data-icon="inline-start" />
                    {editingContent ? "Kunci Editor" : "Edit"}
                  </Toggle>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel htmlFor="review-title">Judul Artikel</FieldLabel>
                <Input
                  id="review-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={readonly}
                />
              </Field>
              <TipTapEditor
                content={content}
                onChange={setContent}
                editable={editingContent}
              />
            </CardContent>
          </Card>

          {/* ── Review Form (PENDING_REVIEW) — hanya Reviewer/Owner ── */}
          {status === "PENDING_REVIEW" &&
            userRole &&
            ["reviewer", "owner"].includes(userRole) && (
              <Card>
                <CardHeader>
                  <CardTitle>Form Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    {/* Auto-publish info */}
                    <Alert>
                      <InfoIcon className="size-4" />
                      <AlertTitle>Auto-publish:</AlertTitle>
                      <AlertDescription>
                        Artikel dengan skor ★ ≥{" "}
                        <span className="font-semibold text-primary">
                          {autoPublishScore}/5
                        </span>{" "}
                        akan otomatis dipublikasikan saat disetujui.
                      </AlertDescription>
                    </Alert>

                    {/* Score + Honor */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="score">
                          Skor{" "}
                          <span className="font-normal text-muted-foreground">
                            (1–5)
                          </span>
                        </FieldLabel>
                        <Rating
                          id="score"
                          value={scoreNum}
                          onValueChange={(v) => setScore(v.toString())}
                          max={5}
                          aria-label="Skor penilaian"
                        >
                          {Array.from({ length: 5 }, (_, i) => (
                            <RatingItem key={i} />
                          ))}
                        </Rating>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="honor">Honor </FieldLabel>
                        <Input
                          id="honor"
                          type="number"
                          min={0}
                          value={honorAmount}
                          onChange={(e) => setHonorAmount(e.target.value)}
                          placeholder={defaultHonor.toString()}
                        />
                      </Field>
                    </div>

                    {/* Notes */}
                    <Field>
                      <FieldLabel htmlFor="notes">
                        Catatan untuk Penulis{" "}
                        <span className="font-normal text-muted-foreground">
                          {confirmDialog === "reject"
                            ? "(wajib diisi jika menolak)"
                            : "(opsional)"}
                        </span>
                      </FieldLabel>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Sampaikan masukan, perbaikan, atau alasan penolakan kepada penulis..."
                        rows={4}
                      />
                    </Field>
                  </FieldGroup>
                  <br />

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={loading}
                      type="button"
                    >
                      Batal
                    </Button>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleReviewAction("revision")}
                        disabled={loading}
                        type="button"
                      >
                        <FileEdit data-icon="inline-start" />
                        Minta Revisi
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReviewAction("reject")}
                        disabled={loading}
                        type="button"
                      >
                        <XCircle data-icon="inline-start" />
                        Tolak
                      </Button>
                      <Button
                        onClick={() => handleReviewAction("approve")}
                        disabled={loading}
                        type="button"
                      >
                        <CheckCircle data-icon="inline-start" />
                        {willAutoPublish && score
                          ? "Setujui & Publish"
                          : "Setujui"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* ── Publish Section (APPROVED) — hanya Reviewer/Owner ── */}
          {status === "APPROVED" &&
            userRole &&
            ["reviewer", "owner"].includes(userRole) && (
              <Card>
                <CardHeader>
                  <CardTitle>Publikasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert variant="default">
                    <CheckCircle className="size-4 text-emerald-600" />
                    <AlertTitle>Artikel sudah disetujui</AlertTitle>
                    <AlertDescription>
                      Status: Disetujui. Silakan terbitkan artikel ini atau
                      publikasikan ke WordPress.
                    </AlertDescription>
                  </Alert>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handlePublish}>
                      <Send data-icon="inline-start" />
                      Terbitkan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* ── Published Info (PUBLISHED) — hanya Reviewer/Owner ── */}
          {status === "PUBLISHED" &&
            userRole &&
            ["reviewer", "owner"].includes(userRole) && (
              <Card>
                <CardHeader>
                  <CardTitle>Artikel Sudah Terbit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert variant="default">
                    <CheckCircle className="size-4 text-emerald-600" />
                    <AlertTitle>Artikel telah diterbitkan</AlertTitle>
                    <AlertDescription>
                      Artikel ini sudah terbit dan tidak dapat diubah. Anda
                      dapat mengarsipkannya jika tidak lagi diperlukan.
                    </AlertDescription>
                  </Alert>
                  <Button variant="outline" onClick={handleArchive}>
                    <Archive data-icon="inline-start" />
                    Arsipkan
                  </Button>
                </CardContent>
              </Card>
            )}
        </div>

        {/* ── Right Column: Metadata Panel ─────────────── */}
        <div className="space-y-4">
          {/* Author Profile Card */}
          <AuthorProfileCard
            author={{
              name: authorName,
              avatar: authorImage,
              email: authorEmail,
              role: "Kontributor",
              totalArticles: undefined,
              honorDefault: defaultHonor,
            }}
          />

          {/* Article Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Artikel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel>Kategori</FieldLabel>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={readonly}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kategori..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tidak ada kategori</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block size-2.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="coverImageUrl">
                  Gambar Cover
                  <span className="font-normal text-muted-foreground">
                    (opsional)
                  </span>
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="coverImageUrl"
                    type="url"
                    value={article.coverImageUrl ?? ""}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                  />
                  {article.coverImageUrl && (
                    <InputGroupAddon align="inline-end">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() =>
                          window.open(article.coverImageUrl, "_blank")
                        }
                      >
                        <ArrowUpRight />
                      </Button>
                    </InputGroupAddon>
                  )}
                </InputGroup>
              </Field>

              {editable && (
                <Field>
                  <FieldLabel htmlFor="excerpt">
                    Ringkasan Artikel{" "}
                    <span className="font-normal text-muted-foreground">
                      (opsional)
                    </span>
                  </FieldLabel>
                  <Textarea
                    id="excerpt"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Ringkasan singkat artikel..."
                    rows={2}
                    disabled={readonly}
                  />
                </Field>
              )}

              <div className="flex items-center gap-2 text-sm">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span>
                  {(article.wordCount ?? 0).toLocaleString("id-ID")} kata
                </span>
              </div>
              {article.wordCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    ~{Math.max(1, Math.round(article.wordCount / 200))} menit
                    dibaca
                  </span>
                </div>
              )}
              {article.createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    Dibuat{" "}
                    {format(new Date(article.createdAt), "d MMM yyyy", {
                      locale: idLocale,
                    })}
                  </span>
                </div>
              )}
              {article.publishedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    Terbit{" "}
                    {format(new Date(article.publishedAt), "d MMM yyyy", {
                      locale: idLocale,
                    })}
                  </span>
                </div>
              )}
              {submittedEvent && (
                <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    Disubmit{" "}
                    {format(new Date(submittedEvent.createdAt), "d MMM yyyy", {
                      locale: idLocale,
                    })}
                  </span>
                </div>
              )}
              {article.coverImageUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">Ada gambar cover</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          {events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline className="[--timeline-dot-size:1.75rem]">
                  {events.map((event, idx) => {
                    const Icon = getEventIcon(event.eventType)
                    const eventLabel = getEventLabel(event.eventType)
                    const eventMeta = parseEventMetadata(event.metadata)
                    return (
                      <TimelineItem key={event.id} className="pb-0">
                        <TimelineDot>
                          <Icon className="size-3.5" />
                        </TimelineDot>
                        <TimelineConnector />
                        <TimelineContent>
                          <TimelineHeader>
                            <TimelineTime dateTime={event.createdAt as string}>
                              {format(
                                new Date(event.createdAt),
                                "d MMM yyyy HH:mm",
                                {
                                  locale: idLocale,
                                }
                              )}
                            </TimelineTime>
                            <TimelineTitle>{eventLabel}</TimelineTitle>
                          </TimelineHeader>
                          <TimelineDescription>
                            oleh {event.user?.name ?? "Sistem"}
                            {eventMeta?.score !== undefined && (
                              <>
                                {" "}
                                · Skor: {Math.round(eventMeta.score / 20)}/5 ★
                              </>
                            )}
                            {eventMeta?.notes && (
                              <> · &ldquo;{eventMeta.notes}&rdquo;</>
                            )}
                          </TimelineDescription>
                        </TimelineContent>
                      </TimelineItem>
                    )
                  })}
                </Timeline>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Confirmation Dialogs ────────────────────────── */}

      {/* Review approve/reject/revision dialog */}
      {(confirmDialog === "approve" ||
        confirmDialog === "reject" ||
        confirmDialog === "revision") && (
        <Dialog
          open={confirmDialog !== null}
          onOpenChange={() => setConfirmDialog(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {confirmDialog === "approve"
                  ? "Setujui Artikel"
                  : confirmDialog === "reject"
                    ? "Tolak Artikel"
                    : "Minta Revisi"}
              </DialogTitle>
              <DialogDescription>
                {confirmDialog === "approve"
                  ? `Artikel akan disetujui dengan skor ${scoreNum}/5 ★.`
                  : confirmDialog === "reject"
                    ? `Artikel akan ditolak dengan skor ${scoreNum}/5 ★. Alasan penolakan: ${notes || "(tidak ada)"}`
                    : `Penulis diminta untuk merevisi artikel dengan skor ${scoreNum}/5 ★.`}
                {willAutoPublish && confirmDialog === "approve" && (
                  <span className="mt-2 block font-medium text-primary">
                    Skor ≥ {autoPublishScore}/5 → artikel akan otomatis
                    dipublikasikan.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(null)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                variant={confirmDialog === "reject" ? "destructive" : "default"}
                onClick={confirmReview}
                disabled={loading}
              >
                {loading
                  ? "Memproses..."
                  : confirmDialog === "approve"
                    ? "Setujui"
                    : confirmDialog === "reject"
                      ? "Tolak"
                      : "Minta Revisi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Submit for review dialog */}
      {confirmDialog === "submit" && (
        <Dialog
          open={confirmDialog !== null}
          onOpenChange={() => setConfirmDialog(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Submit untuk Review</DialogTitle>
              <DialogDescription>
                Artikel akan dikirim ke reviewer default. Setelah disubmit, Anda
                tidak dapat mengubah konten hingga ada keputusan review.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(null)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button onClick={confirmSubmit} disabled={loading}>
                {loading ? "Memproses..." : "Kirim ke Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Publish dialog */}
      {confirmDialog === "publish" && (
        <Dialog
          open={confirmDialog !== null}
          onOpenChange={() => setConfirmDialog(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Terbitkan Artikel</DialogTitle>
              <DialogDescription>
                Artikel akan diterbitkan. Publikasi ke WordPress menggunakan
                status <strong>Draft</strong>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(null)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button onClick={confirmPublish} disabled={loading}>
                {loading ? "Menerbitkan..." : "Terbitkan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Archive dialog */}
      {confirmDialog === "archive" && (
        <Dialog
          open={confirmDialog !== null}
          onOpenChange={() => setConfirmDialog(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Arsipkan Artikel</DialogTitle>
              <DialogDescription>
                Artikel akan diarsipkan. Artikel yang diarsipkan tidak dapat
                diubah dan akan tersembunyi dari daftar artikel aktif.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(null)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={confirmArchive}
                disabled={loading}
              >
                {loading ? "Mengarsipkan..." : "Arsipkan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import {
  ArrowLeft,
  Check,
  Circle,
  Dot,
  DotIcon,
  DotSquare,
  Save,
  SendHorizontal,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineHeader,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline"
import { SaveIndicator } from "@/components/save-indicator"
import { useAutoSave } from "@/hooks/use-auto-save"
import { statusMeta } from "../_components/article-data"
import { ArticleStatus, ArticleStatusLabel } from "@kreatur/commons"

import dynamic from "next/dynamic"

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

import { Breadcrumb } from "@/components/breadcrumb-nav"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/eden-client"
import { cn, getErrorMessage } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────

interface CategoryItem {
  id: string
  name: string
  slug: string
  color: string
}

interface ArticleEvent {
  id: string
  eventType: string
  metadata?: string | null
  createdAt: string | Date
  user: { id: string; name: string; email: string; image?: string | null }
}

// ─── Helpers ────────────────────────────────────────────

function isValidUrl(url: string): boolean {
  // Relative path (contoh: /uploads/image.jpg)
  if (url.startsWith("/")) return true

  // Absolute path without protocol (contoh: //cdn.example.com/image.jpg)
  if (url.startsWith("//")) return true

  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

const QUALITY_ITEMS = [
  { key: "judul", label: "Judul artikel diisi" },
  { key: "kategori", label: "Kategori dipilih" },
  { key: "wordCount", label: "Jumlah kata 500–1000 (saran)" },
  { key: "konten", label: "Konten artikel ditulis" },
  { key: "cover", label: "Cover gambar diisi" },
] as const

// ─── Page ───────────────────────────────────────────────

export default function ArticleDetailPage() {
  const params = useParams<{ slug: string; id: string }>()
  const router = useRouter()
  const slug = params.slug
  const id = params.id

  const [article, setArticle] = React.useState<any>(null)
  const [categories, setCategories] = React.useState<CategoryItem[]>([])
  const [events, setEvents] = React.useState<ArticleEvent[]>([])
  const [loadingPage, setLoadingPage] = React.useState(true)

  // Form state
  const [title, setTitle] = React.useState("")
  const [coverImageUrl, setCoverImageUrl] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [content, setContent] = React.useState("")

  // Role state
  const [userRole, setUserRole] = React.useState<string | null>(null)
  const [roleChecking, setRoleChecking] = React.useState(true)

  // Submit state
  const [saving, setSaving] = React.useState(false)
  const [confirmSubmit, setConfirmSubmit] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitSuccess, setSubmitSuccess] = React.useState(false)

  // Track perubahan yang belum disimpan
  const initialContentRef = React.useRef({
    title: "",
    categoryId: "",
    coverImageUrl: "",
    content: "",
  })
  const isDirty = React.useMemo(() => {
    return (
      title !== initialContentRef.current.title ||
      categoryId !== initialContentRef.current.categoryId ||
      coverImageUrl !== initialContentRef.current.coverImageUrl ||
      content !== initialContentRef.current.content
    )
  }, [title, categoryId, coverImageUrl, content])

  // ── Derived values ──
  const status = article?.status as keyof typeof ArticleStatusLabel | undefined
  const isDraft = status === "DRAFT"
  const isRevisionRequested = status === "REVISION_REQUESTED"
  const isContributor = userRole === "contributor"
  const isEditor = userRole === "editor"
  const canEdit = isContributor && (isDraft || isRevisionRequested)
  const statusMetaData = status
    ? (statusMeta[status] ?? statusMeta.DRAFT)
    : statusMeta.DRAFT

  const isCoverUrlPresent = coverImageUrl.trim().length > 0
  const isCoverUrlValid = isCoverUrlPresent && isValidUrl(coverImageUrl)

  // Word count
  const wordCount = React.useMemo(() => {
    const text = content.replace(/<[^>]*>/g, "")
    return text.trim() ? text.trim().split(/\s+/).length : 0
  }, [content])

  // Quality checklist (only for DRAFT)
  const checklist = React.useMemo(() => {
    const hasContent = content.replace(/<[^>]*>/g, "").trim().length > 0
    return {
      judul: title.trim().length > 0,
      kategori: categoryId.length > 0,
      wordCount: wordCount >= 500 && wordCount <= 1000,
      konten: hasContent,
      cover: isCoverUrlValid,
    }
  }, [title, categoryId, wordCount, isCoverUrlValid, content])

  const checkedCount = Object.values(checklist).filter(Boolean).length
  const allChecked = checkedCount === QUALITY_ITEMS.length

  // ── Auto-save ──
  const autoSaveHandler = React.useCallback(async () => {
    if (!title.trim()) return

    const isValidCover =
      coverImageUrl.trim().length > 0 && isValidUrl(coverImageUrl)

    const { error } = await api.api
      .orgs({ slug })
      .articles({ id })
      .put({
        title: title.trim(),
        content: content || undefined,
        categoryId: categoryId || null,
        coverImageUrl: isValidCover ? coverImageUrl : null,
      })
    if (error) {
      throw new Error(getErrorMessage(error) ?? "Gagal auto-save")
    }
    initialContentRef.current = { title, categoryId, coverImageUrl, content }
  }, [slug, id, title, content, categoryId, coverImageUrl])

  const { saveStatus } = useAutoSave({
    onSave: autoSaveHandler,
    isDirty: isDirty && !!article && canEdit,
  })

  // ── beforeunload guard ──
  React.useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  // ── Fetch data ──
  React.useEffect(() => {
    if (!slug || !id) return
    Promise.all([
      api.api.orgs({ slug }).articles({ id }).get(),
      api.api.orgs({ slug }).categories.get({ query: { pageSize: "100" } }),
      api.api.orgs({ slug }).articles({ id }).events.get(),
    ])
      .then(([articleRes, catRes, eventsRes]) => {
        if (articleRes.data?.success) {
          const a = articleRes.data.data
          setArticle(a)
          setTitle(a.title ?? "")
          setCoverImageUrl(a.coverImageUrl ?? "")
          setCategoryId(a.categoryId ?? "")
          setContent(a.content ?? "")
          initialContentRef.current = {
            title: a.title ?? "",
            categoryId: a.categoryId ?? "",
            coverImageUrl: a.coverImageUrl ?? "",
            content: a.content ?? "",
          }
        }
        if (catRes.data?.success && Array.isArray(catRes.data.data)) {
          setCategories(catRes.data.data)
        }
        if (eventsRes.data?.success && Array.isArray(eventsRes.data.data)) {
          setEvents(eventsRes.data.data)
        }
      })
      .finally(() => setLoadingPage(false))
  }, [slug, id])

  // ── Role check — hanya Kontributor & Editor yang akses /[id] ──
  React.useEffect(() => {
    if (loadingPage) return
    authClient.organization.getActiveMemberRole({}).then(({ data }) => {
      if (data?.role) {
        const raw = Array.isArray(data.role) ? data.role[0] : data.role
        const role =
          raw.toLowerCase() === "member" ? "contributor" : raw.toLowerCase()
        setUserRole(role)
        // Reviewer/Owner → redirect ke /review
        if (role === "reviewer" || role === "owner") {
          router.replace(`/orgs/${slug}/articles/${id}/review`)
          return
        }
      }
      setRoleChecking(false)
    })
  }, [slug, id, loadingPage, router])

  // ── Handlers ──

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Judul artikel harus diisi")
      return
    }

    setSaving(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .articles({ id })
        .put({
          title: title.trim(),
          content: content || undefined,
          categoryId: categoryId || null,
          coverImageUrl: isCoverUrlValid ? coverImageUrl : null,
        })
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal menyimpan")
      } else {
        initialContentRef.current = {
          title,
          categoryId: categoryId || "",
          coverImageUrl,
          content,
        }
        toast.success("Perubahan berhasil disimpan")
        router.refresh()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitForReview() {
    setSubmitting(true)
    try {
      const { error } = await api.api
        .orgs({ slug })
        .articles({ id })
        .submit.post({})
      if (error) {
        toast.error(getErrorMessage(error) ?? "Gagal submit artikel")
      } else {
        setSubmitSuccess(true)
        setConfirmSubmit(false)
        // Refresh data dari server untuk dapat status terbaru
        router.refresh()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──
  if (loadingPage || roleChecking) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Artikel tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="@container/main space-y-6">
      {/* Header */}
      {/* Submit success banner */}
      {submitSuccess && (
        <Alert variant="default">
          <SendHorizontal className="size-4" />
          <AlertTitle>Artikel berhasil dikirim!</AlertTitle>
          <AlertDescription>
            Artikel Anda telah berhasil dikirim untuk proses review, silakan
            tunggu 1–2 hari kerja. Tim editorial akan meninjau artikel Anda.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/orgs/${slug}/articles`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="space-y-1">
            <Breadcrumb
              items={[
                { label: "Artikel", href: `/orgs/${slug}/articles` },
                { label: article.title },
              ]}
              className="mb-0.5"
            />
            <h1 className="text-2xl font-medium">
              {isRevisionRequested
                ? "Revisi Artikel"
                : isDraft
                  ? "Edit Artikel"
                  : "Detail Artikel"}
            </h1>
            <div className="text-sm text-muted-foreground">{article.title}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            className={cn(
              statusMetaData.badgeClass,
              "pointer-events-none p-3.5 text-sm font-medium"
            )}
          >
            {ArticleStatusLabel[status ?? ArticleStatus.DRAFT]}
          </Badge>
          {canEdit && !submitSuccess && (
            <div className="flex items-center gap-3">
              <SaveIndicator status={saveStatus} />
              <Button variant="outline" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <Save data-icon="inline-start" />
                )}
                Simpan {isDraft ? "Draf" : isRevisionRequested ? "Revisi" : ""}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Content */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {isDraft ? "Konten Artikel" : "Konten Artikel"}
              </CardTitle>
              {isDraft ? (
                <CardDescription>
                  Edit judul dan konten artikel Anda
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {canEdit && !submitSuccess ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="detail-title">
                      Judul Artikel
                    </FieldLabel>
                    <Input
                      id="detail-title"
                      placeholder="Masukkan judul artikel..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </Field>

                  <div className="flex gap-4">
                    <Field
                      className="flex-1"
                      data-invalid={
                        isCoverUrlPresent && !isCoverUrlValid
                          ? "true"
                          : undefined
                      }
                    >
                      <FieldLabel htmlFor="detail-cover">
                        URL Gambar Cover
                      </FieldLabel>
                      <Input
                        id="detail-cover"
                        placeholder="https://contoh.com/gambar.jpg"
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        aria-invalid={
                          (isCoverUrlPresent && !isCoverUrlValid) || undefined
                        }
                      />
                    </Field>
                    <Field className="flex-1">
                      <FieldLabel htmlFor="detail-category">
                        Kategori
                      </FieldLabel>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger id="detail-category" className="w-full">
                          <SelectValue placeholder="Pilih kategori..." />
                        </SelectTrigger>
                        <SelectContent>
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
                  </div>

                  <div>
                    <FieldLabel className="mb-2 block">Konten</FieldLabel>
                    <TipTapEditor
                      content={content}
                      onChange={setContent}
                      editable
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    {article.category?.name && (
                      <Badge variant="outline">{article.category.name}</Badge>
                    )}
                    <h1 className="text-3xl font-medium">{article.title}</h1>
                    {article.author?.name && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Oleh {article.author.name}
                        {article.publishedAt && (
                          <>
                            {" "}
                            &middot;{" "}
                            {format(
                              new Date(article.publishedAt),
                              "d MMMM yyyy",
                              { locale: idLocale }
                            )}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert [&_img]:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          {/* Submit ke Review — hanya Kontributor dgn DRAFT sebelum submit */}
          {canEdit && !submitSuccess && (
            <Card>
              <CardHeader>
                <CardTitle>Submit ke Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {checkedCount} dari {QUALITY_ITEMS.length} syarat terpenuhi
                </div>
                <Progress value={(checkedCount / QUALITY_ITEMS.length) * 100} />
                <ul className="space-y-1.5">
                  {QUALITY_ITEMS.map((item) => {
                    const done = checklist[item.key as keyof typeof checklist]
                    const Icon = done ? Check : Circle
                    return (
                      <li
                        key={item.key}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Icon
                          className={cn(
                            done ? "text-primary" : "text-muted-foreground",
                            "size-4"
                          )}
                        />
                        <span
                          className={
                            done ? "text-foreground" : "text-muted-foreground"
                          }
                        >
                          {item.label}
                        </span>
                      </li>
                    )
                  })}
                </ul>

                <Button
                  className="w-full"
                  onClick={() => setConfirmSubmit(true)}
                  disabled={!allChecked}
                  title={
                    !allChecked
                      ? "Lengkapi semua syarat (5/5) sebelum submit"
                      : undefined
                  }
                >
                  <SendHorizontal />
                  Kirim ke Review
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada aktivitas
                </p>
              ) : (
                <Timeline>
                  {events.map((event) => (
                    <TimelineItem key={event.id} className="pb-0">
                      <TimelineDot />
                      <TimelineConnector />
                      <TimelineContent>
                        <TimelineHeader>
                          <TimelineTime
                            dateTime={format(
                              new Date(event.createdAt),
                              "yyyy-MM-dd"
                            )}
                          >
                            {format(new Date(event.createdAt), "d MMM HH:mm", {
                              locale: idLocale,
                            })}
                          </TimelineTime>
                          <TimelineTitle>
                            {event.user.name} —{" "}
                            {event.eventType === "CREATED"
                              ? "Membuat artikel"
                              : event.eventType === "SUBMITTED"
                                ? "Submit review"
                                : event.eventType === "UPDATED"
                                  ? "Memperbarui"
                                  : event.eventType === "APPROVED"
                                    ? "Menyetujui"
                                    : event.eventType === "REVISION_REQUESTED"
                                      ? "Minta revisi"
                                      : event.eventType === "REJECTED"
                                        ? "Menolak"
                                        : event.eventType === "PUBLISHED"
                                          ? "Menerbitkan"
                                          : event.eventType}
                          </TimelineTitle>
                        </TimelineHeader>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kirim ke Review</DialogTitle>
            <DialogDescription>
              Artikel akan dikirim ke reviewer untuk ditinjau. Setelah disubmit,
              Anda tidak dapat mengubah konten hingga reviewer memberikan
              keputusan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmSubmit(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleSubmitForReview} disabled={submitting}>
              {submitting && <Spinner />}
              Kirim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

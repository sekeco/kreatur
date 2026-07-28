"use client"

import { Check, Circle, Eye, EyeOff, InfoIcon, Save } from "lucide-react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { SaveIndicator } from "@/components/save-indicator"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Spinner } from "@/components/ui/spinner"
import { useAutoSave } from "@/hooks/use-auto-save"

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

import { api } from "@/lib/eden-client"
import { authClient } from "@/lib/auth-client"
import { normalizeRole } from "@/lib/normalize-role"
import { getErrorMessage } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

// ── Helpers ──────────────────────────────────────────────────────────────

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

export default function NewArticlePage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [title, setTitle] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [coverImageUrl, setCoverImageUrl] = React.useState("")
  const [content, setContent] = React.useState("")
  const [categories, setCategories] = React.useState<Category[]>([])
  const [saving, setSaving] = React.useState(false)
  const [articleId, setArticleId] = React.useState<string | null>(null)
  const [preview, setPreview] = React.useState(false)
  const [checkingRole, setCheckingRole] = React.useState(true)

  // Role check — hanya kontributor & owner yang bisa membuat artikel
  React.useEffect(() => {
    authClient.organization.getActiveMemberRole({}).then(({ data }) => {
      if (data?.role) {
        const raw = Array.isArray(data.role) ? data.role[0] : data.role
        const role = normalizeRole(raw)
        if (role !== "contributor" && role !== "owner") {
          toast.error("Anda tidak memiliki akses untuk membuat artikel")
          router.replace(`/orgs/${slug}/articles`)
          return
        }
      }
      setCheckingRole(false)
    })
  }, [slug, router])

  // Track apakah ada perubahan yang belum disimpan
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

  // Fetch categories on mount
  React.useEffect(() => {
    api.api
      .orgs({ slug })
      .categories.get({ query: { pageSize: "100" } })
      .then(({ data }) => {
        if (data?.success && Array.isArray(data.data)) {
          setCategories(data.data)
        }
      })
  }, [slug])

  // ── Auto-save ──
  const autoSaveHandler = React.useCallback(async () => {
    if (!title.trim() || !articleId) {
      // Belum pernah disimpan, skip auto-save
      return
    }

    const slugified = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const hasValidCover =
      coverImageUrl.trim().length > 0 && isValidUrl(coverImageUrl)

    const { error } = await api.api
      .orgs({ slug })
      .articles({ id: articleId })
      .put({
        title: title.trim(),
        slug: slugified,
        content: content || undefined,
        categoryId: categoryId || null,
        coverImageUrl: hasValidCover ? coverImageUrl : null,
      })

    if (error) {
      throw new Error(getErrorMessage(error) ?? "Gagal auto-save")
    }
  }, [slug, articleId, title, content, categoryId, coverImageUrl])

  const { saveStatus, triggerSave } = useAutoSave({
    onSave: autoSaveHandler,
    isDirty: isDirty && !!articleId,
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

  // Word count
  const wordCount = React.useMemo(() => {
    const text = content.replace(/<[^>]*>/g, "")
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    return words
  }, [content])

  const isCoverUrlPresent = coverImageUrl.trim().length > 0
  const isCoverUrlValid = isCoverUrlPresent && isValidUrl(coverImageUrl)

  // Quality checklist
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

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Judul artikel harus diisi")
      return
    }

    setSaving(true)

    const slugified = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    try {
      if (articleId) {
        // Update artikel yang sudah ada
        const { error } = await api.api
          .orgs({ slug })
          .articles({ id: articleId })
          .put({
            title: title.trim(),
            slug: slugified,
            content: content || undefined,
            categoryId: categoryId || null,
            coverImageUrl: isCoverUrlValid ? coverImageUrl : null,
          })
        if (error) {
          toast.error(getErrorMessage(error) ?? "Gagal menyimpan artikel")
          return
        }
        initialContentRef.current = {
          title,
          categoryId,
          coverImageUrl,
          content,
        }
        toast.success("Perubahan berhasil disimpan")
      } else {
        // Buat artikel baru
        const { data, error } = await api.api.orgs({ slug }).articles.post({
          title: title.trim(),
          slug: slugified,
          content,
          categoryId: categoryId || undefined,
          coverImageUrl: isCoverUrlValid ? coverImageUrl : undefined,
        })
        if (error || !data?.success) {
          toast.error(getErrorMessage(error) ?? "Gagal menyimpan artikel")
          return
        }
        setArticleId(data.data.id)
        initialContentRef.current = {
          title,
          categoryId,
          coverImageUrl,
          content,
        }
        toast.success("Artikel berhasil dibuat!")
        router.push(`/orgs/${slug}/articles`)
        router.refresh()
      }
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  if (checkingRole) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="@container/main space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium">Artikel Baru</h1>
          <p className="text-sm text-muted-foreground">
            Buat artikel baru untuk ruang kerja ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          <Button
            variant="outline"
            onClick={() => setPreview(!preview)}
            title={preview ? "Kembali edit" : "Pratinjau"}
          >
            <Eye className="size-4" />
            {preview ? "Edit" : "Pratinjau"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <Save data-icon="inline-start" />
            )}
            {articleId ? "Simpan" : "Buat Artikel"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left: Form ────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Konten Artikel</CardTitle>
              <CardDescription>
                Tulis judul dan konten artikel Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preview ? (
                <div className="space-y-6">
                  <h2 className="text-3xl font-medium">
                    {title || "(Judul belum diisi)"}
                  </h2>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert [&_img]:rounded-lg"
                    dangerouslySetInnerHTML={{
                      __html: content || "<p>(Konten belum diisi)</p>",
                    }}
                  />
                </div>
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor="new-title">Judul Artikel</FieldLabel>
                    <Input
                      id="new-title"
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
                      <FieldLabel htmlFor="new-cover">
                        URL Gambar Cover
                      </FieldLabel>
                      <Input
                        id="new-cover"
                        placeholder="https://contoh.com/gambar.jpg"
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        aria-invalid={
                          (isCoverUrlPresent && !isCoverUrlValid) || undefined
                        }
                      />
                    </Field>
                    <Field className="flex-1">
                      <FieldLabel htmlFor="new-category">Kategori</FieldLabel>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger id="new-category" className="w-full">
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Metadata & Checklist ──────────────── */}
        <div className="space-y-4">
          {/* Quality Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Cek Kualitas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {checkedCount} dari {QUALITY_ITEMS.length} terpenuhi
              </div>
              <Progress value={(checkedCount / QUALITY_ITEMS.length) * 100} />
              <ul className="mt-3 space-y-1.5">
                {QUALITY_ITEMS.map((item) => {
                  const done = checklist[item.key as keyof typeof checklist]
                  const Icon = done ? Check : Circle
                  return (
                    <li
                      key={item.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Icon
                        className={
                          done ? "text-primary" : "text-muted-foreground"
                        }
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
            </CardContent>
          </Card>

          {/* Panduan Penulisan */}
          <Card>
            <CardHeader>
              <CardTitle>Panduan Penulisan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-1.5">
                    <InfoIcon className="mt-1 size-3 shrink-0" />
                    <span>Judul jelas dan mencerminkan isi</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <InfoIcon className="mt-1 size-3 shrink-0" />
                    <span>Kategori sesuai dengan topik</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <InfoIcon className="mt-1 size-3 shrink-0" />
                    <span>500–1000 kata</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <InfoIcon className="mt-1 size-3 shrink-0" />
                    <span>Konten orisinal dan bebas plagiarisme</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <InfoIcon className="mt-1 size-3 shrink-0" />
                    <span>Menggunakan bahasa Indonesia yang baik</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <InfoIcon className="mt-1 size-3 shrink-0" />
                    <span>Menyertakan sumber referensi jika ada</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <InfoIcon className="mt-1 size-3 shrink-0" />
                    <span>Cover gambar menarik dan relevan</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <InfoIcon className="mt-1 size-3 shrink-0" />
                    <span>Paragraf pembuka yang engaging</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <InfoIcon className="mt-1 size-3 shrink-0" />
                    <span>Tidak mengandung SARA atau hoaks</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <InfoIcon className="mt-1 size-3 shrink-0" />
                    <span>Mengikuti pedoman gaya penulisan</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

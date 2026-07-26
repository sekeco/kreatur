"use client"
"use no memo"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import type { ColumnDef } from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { CheckCircle, Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn, getErrorMessage, getInitials } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/eden-client"

import { statusMeta, type ArticleRow } from "./article-data"

function StatusBadge({ status }: { status: ArticleRow["status"] }) {
  const meta = statusMeta[status]

  return (
    <Badge
      className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)}
      variant="outline"
    >
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {status}
    </Badge>
  )
}

function AuthorCell({ author }: { author: ArticleRow["author"] }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-7">
        <AvatarImage src={author.avatar || undefined} alt={author.name} />
        <AvatarFallback className="text-[10px]">
          {getInitials(author.name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm">{author.name}</span>
    </div>
  )
}

function formatHonor(honor: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(honor)
}

function useUserRole(slug: string) {
  const [role, setRole] = useState<string | null>(null)
  useEffect(() => {
    authClient.organization.getActiveMemberRole({}).then(({ data }) => {
      if (data?.role) {
        const raw = Array.isArray(data.role) ? data.role[0] : data.role
        setRole(
          raw.toLowerCase() === "member" ? "contributor" : raw.toLowerCase()
        )
      }
    })
  }, [slug])
  return role
}

export function ArticleActionsCell({ row }: { row: { original: ArticleRow } }) {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params.slug
  const article = row.original
  const userRole = useUserRole(slug)
  const [confirmAction, setConfirmAction] = useState<
    "delete" | "approve" | "reject" | null
  >(null)
  const [busy, setBusy] = useState(false)

  const isReviewer = userRole === "reviewer"
  const isEditor = userRole === "editor"
  const isOwner = userRole === "owner"
  const isContributor = userRole === "contributor"
  const isEditorial = isEditor || isReviewer || isOwner
  const canFullReview = isReviewer || isOwner
  const canManage = isOwner
  const isPendingReview = article.status === "PENDING_REVIEW"
  const isDraft = article.status === "DRAFT"

  // Tentukan primary action button
  // - Contributor DRAFT → /[id] (Edit)
  // - Contributor non-DRAFT → /[id] (Lihat)
  // - Editorial (Editor/Reviewer/Owner) → /[id]/review
  const isEditing = isContributor && isDraft
  const hasDropdown = isEditing || (isEditorial && isPendingReview) || canManage
  const primaryHref = isEditorial
    ? `/orgs/${slug}/articles/${article.id}/review`
    : `/orgs/${slug}/articles/${article.id}`
  const primaryLabel = isEditing
    ? "Edit"
    : isEditorial && isPendingReview
      ? "Review"
      : "Lihat"
  const PrimaryIcon = isEditing ? Edit : Eye

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link prefetch={false} href={primaryHref}>
            <PrimaryIcon />
            {primaryLabel}
          </Link>
        </Button>
        {hasDropdown && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Aksi untuk ${article.title}`}
                className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                size="icon-sm"
                variant="ghost"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Contributor: edit hanya untuk DRAFT */}
              {isEditing && (
                <DropdownMenuItem asChild>
                  <Link href={`/orgs/${slug}/articles/${article.id}`}>
                    <Edit />
                    Edit
                  </Link>
                </DropdownMenuItem>
              )}

              {/* Editorial: review hanya untuk PENDING_REVIEW */}
              {isEditorial && isPendingReview && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/orgs/${slug}/articles/${article.id}/review`}>
                      <CheckCircle className="text-emerald-600" />
                      {isEditor ? "Edit & Proses" : "Review & Setujui"}
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              {/* Hapus: hanya owner */}
              {canManage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={async () => {
                      setBusy(true)
                      try {
                        const { error } = await api.api
                          .orgs({ slug })
                          .articles({ id: article.id })
                          .delete()
                        if (error) {
                          toast.error(
                            getErrorMessage(error) ?? "Gagal menghapus artikel"
                          )
                        } else {
                          toast.success("Artikel berhasil dihapus")
                          router.refresh()
                        }
                      } catch {
                        toast.error("Terjadi kesalahan")
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    <Trash2 />
                    Hapus
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </>
  )
}

function TitleCell({ row }: { row: { original: ArticleRow } }) {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  return (
    <div className="max-w-md min-w-0">
      <Link
        prefetch={false}
        href={`/orgs/${slug}/articles/${row.original.id}`}
        className="hover:underline"
      >
        <div className="truncate text-sm font-medium text-foreground">
          {row.original.title}
        </div>
      </Link>
      <div className="truncate text-xs text-muted-foreground">
        {row.original.category} &middot;{" "}
        {row.original.wordCount.toLocaleString("id-ID")} kata
      </div>
    </div>
  )
}

export const articleColumns: ColumnDef<ArticleRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Pilih semua artikel"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label={`Pilih ${row.original.title}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: "search",
    accessorFn: (row) => `${row.title} ${row.author.name}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "title",
    header: "Judul",
    cell: TitleCell,
  },
  {
    accessorKey: "author",
    header: "Penulis",
    filterFn: "equalsString",
    cell: ({ row }) => <AuthorCell author={row.original.author} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "honor",
    header: "Honor",
    cell: ({ row }) => (
      <div className="text-sm tabular-nums">
        {formatHonor(row.original.honor)}
      </div>
    ),
  },
  {
    id: "updatedAt",
    accessorFn: (row) => parseISO(row.updatedAt).getTime(),
    header: "Terakhir Diubah",
    cell: ({ row }) => (
      <div className="text-sm text-foreground">
        {format(parseISO(row.original.updatedAt), "d MMM yyyy", {
          locale: id,
        })}
      </div>
    ),
    sortingFn: "datetime",
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => <ArticleActionsCell row={row} />,
    enableHiding: false,
    enableSorting: false,
  },
]

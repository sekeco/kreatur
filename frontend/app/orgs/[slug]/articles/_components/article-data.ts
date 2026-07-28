import {
  ArticleStatus,
  ArticleStatusLabel,
  ALL_ARTICLE_STATUSES,
  type ArticleStatus as ArticleStatusType,
} from "@kreatur/commons"

export type ArticleRow = {
  id: string
  title: string
  slug: string
  excerpt: string
  status: ArticleStatusType
  category: string
  author: {
    name: string
    avatar: string
  }
  reviewer: {
    name: string
    avatar: string
  } | null
  wordCount: number
  honor: number
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export const statusFilterOptions = [
  { value: "all", label: "Semua Status" },
  ...ALL_ARTICLE_STATUSES.map((s) => ({ value: s, label: ArticleStatusLabel[s] })),
]

export const filters = {
  status: statusFilterOptions,
} as const

export const statusMeta: Record<
  ArticleStatusType,
  { badgeClass: string; dotClass: string }
> = {
  [ArticleStatus.DRAFT]: {
    badgeClass:
      "border-muted-foreground/30 bg-muted text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  [ArticleStatus.PENDING_REVIEW]: {
    badgeClass:
      "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
  [ArticleStatus.REVISION_REQUESTED]: {
    badgeClass:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  [ArticleStatus.APPROVED]: {
    badgeClass:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  [ArticleStatus.REJECTED]: {
    badgeClass:
      "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
    dotClass: "bg-red-500",
  },
  [ArticleStatus.PUBLISHED]: {
    badgeClass:
      "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
    dotClass: "bg-violet-500",
  },
  [ArticleStatus.ARCHIVED]: {
    badgeClass:
      "border-border bg-muted/50 text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
}

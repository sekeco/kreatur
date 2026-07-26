/**
 * Global enum untuk status artikel.
 * Digunakan bersama oleh backend dan frontend.
 *
 * Workflow: DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED
 *           DRAFT → PENDING_REVIEW → REVISION_REQUESTED → (back to PENDING_REVIEW)
 *           PENDING_REVIEW → REJECTED
 *           PUBLISHED → ARCHIVED
 */
export const ArticleStatus = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  REVISION_REQUESTED: "REVISION_REQUESTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const

export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus]

/** Label yang ditampilkan di UI untuk setiap status */
export const ArticleStatusLabel: Record<ArticleStatus, string> = {
  [ArticleStatus.DRAFT]: "Draft",
  [ArticleStatus.PENDING_REVIEW]: "Pending Review",
  [ArticleStatus.REVISION_REQUESTED]: "Revisi",
  [ArticleStatus.APPROVED]: "Disetujui",
  [ArticleStatus.REJECTED]: "Ditolak",
  [ArticleStatus.PUBLISHED]: "Terbit",
  [ArticleStatus.ARCHIVED]: "Arsip",
}

/** Warna/grup untuk filter di sidebar */
export const ArticleStatusCategory: Record<ArticleStatus, string> = {
  [ArticleStatus.DRAFT]: "Penulisan",
  [ArticleStatus.PENDING_REVIEW]: "Review",
  [ArticleStatus.REVISION_REQUESTED]: "Review",
  [ArticleStatus.APPROVED]: "Review",
  [ArticleStatus.REJECTED]: "Final",
  [ArticleStatus.PUBLISHED]: "Final",
  [ArticleStatus.ARCHIVED]: "Final",
}

/** Semua status yang valid */
export const ALL_ARTICLE_STATUSES: ArticleStatus[] = Object.values(ArticleStatus)

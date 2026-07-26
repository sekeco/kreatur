/**
 * Status untuk payout request.
 */
export const PayoutStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
} as const

export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus]

/** Label yang ditampilkan di UI untuk setiap status payout */
export const PayoutStatusLabel: Record<PayoutStatus, string> = {
  [PayoutStatus.PENDING]: "Menunggu",
  [PayoutStatus.APPROVED]: "Disetujui",
  [PayoutStatus.PROCESSING]: "Diproses",
  [PayoutStatus.COMPLETED]: "Selesai",
  [PayoutStatus.REJECTED]: "Ditolak",
}

/** Semua status payout yang valid */
export const ALL_PAYOUT_STATUSES: PayoutStatus[] = Object.values(PayoutStatus)

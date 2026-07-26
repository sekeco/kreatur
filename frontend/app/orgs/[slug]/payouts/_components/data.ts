export interface PayoutArticle {
  id: string
  title: string
  amount: number
}

export interface PayoutRow {
  id: string
  contributor: string
  contributorEmail: string
  totalAmount: number
  totalArticles: number
  status: string
  requestedAt: string
  processedAt: string | null
  completedAt: string | null
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  reviewNotes: string | null
  articles: PayoutArticle[]
}

export const sortOptions = [
  { value: "requestedAt-desc", label: "Terbaru" },
  { value: "requestedAt-asc", label: "Terlama" },
  { value: "totalAmount-desc", label: "Nominal Tertinggi" },
  { value: "totalAmount-asc", label: "Nominal Terendah" },
  { value: "totalArticles-desc", label: "Artikel Terbanyak" },
  { value: "totalArticles-asc", label: "Artikel Tersedikit" },
] as const

export const filters = {
  status: [
    { value: "all", label: "Semua Status" },
    { value: "PENDING", label: "Menunggu" },
    { value: "APPROVED", label: "Disetujui" },
    { value: "PROCESSING", label: "Diproses" },
    { value: "COMPLETED", label: "Selesai" },
    { value: "REJECTED", label: "Ditolak" },
    { value: "CANCELLED", label: "Dibatalkan" },
  ],
}

export const statusMeta: Record<string, { badgeClass: string; dotClass: string; label: string }> = {
  PENDING: { badgeClass: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400", dotClass: "bg-blue-500", label: "Menunggu" },
  APPROVED: { badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dotClass: "bg-emerald-500", label: "Disetujui" },
  PROCESSING: { badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400", dotClass: "bg-amber-500", label: "Diproses" },
  COMPLETED: { badgeClass: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400", dotClass: "bg-violet-500", label: "Selesai" },
  REJECTED: { badgeClass: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400", dotClass: "bg-red-500", label: "Ditolak" },
  CANCELLED: { badgeClass: "border-gray-500/20 bg-gray-500/10 text-gray-600 dark:text-gray-400", dotClass: "bg-gray-500", label: "Dibatalkan" },
}

// ─── Mock Data ─────────────────────────────────────────

export const payouts: PayoutRow[] = [
  {
    id: "PO-001", contributor: "Budi Santoso", contributorEmail: "budi@contoh.com",
    totalAmount: 300000, totalArticles: 2, status: "PENDING",
    requestedAt: "2026-07-19T10:00:00Z", processedAt: null, completedAt: null,
    bankName: "BCA", bankAccountNumber: "1234567890", bankAccountName: "Budi Santoso",
    reviewNotes: null,
    articles: [
      { id: "pi-1", title: "Mengenal Lebih Dalam Ekosistem Startup Digital di Indonesia", amount: 150000 },
      { id: "pi-2", title: "Tips Memilih Kamera Mirrorless untuk Pemula", amount: 150000 },
    ],
  },
  {
    id: "PO-002", contributor: "Ayu Lestari", contributorEmail: "ayu@contoh.com",
    totalAmount: 370000, totalArticles: 3, status: "APPROVED",
    requestedAt: "2026-07-14T08:30:00Z", processedAt: "2026-07-16T14:00:00Z", completedAt: null,
    bankName: "Mandiri", bankAccountNumber: "9876543210", bankAccountName: "Ayu Lestari",
    reviewNotes: "Mohon lampirkan bukti transfer.",
    articles: [
      { id: "pi-3", title: "Panduan Lengkap Content Marketing untuk Bisnis UKM", amount: 120000 },
      { id: "pi-4", title: "Transformasi Digital di Sektor Pendidikan", amount: 160000 },
      { id: "pi-5", title: "Membangun Brand Personal di LinkedIn", amount: 90000 },
    ],
  },
  {
    id: "PO-003", contributor: "Dimas Ardianto", contributorEmail: "dimas@contoh.com",
    totalAmount: 350000, totalArticles: 2, status: "COMPLETED",
    requestedAt: "2026-07-07T09:15:00Z", processedAt: "2026-07-11T10:00:00Z", completedAt: "2026-07-13T16:00:00Z",
    bankName: "BNI", bankAccountNumber: "5556667777", bankAccountName: "Dimas Ardianto",
    reviewNotes: null,
    articles: [
      { id: "pi-6", title: "Analisis Dampak Kebijakan Ekonomi terhadap Sektor Ritel", amount: 200000 },
      { id: "pi-7", title: "Inovasi Teknologi Blockchain di Luar Cryptocurrency", amount: 150000 },
    ],
  },
  {
    id: "PO-004", contributor: "Budi Santoso", contributorEmail: "budi@contoh.com",
    totalAmount: 150000, totalArticles: 1, status: "REJECTED",
    requestedAt: "2026-06-30T11:00:00Z", processedAt: "2026-07-03T09:00:00Z", completedAt: null,
    bankName: "BCA", bankAccountNumber: "1234567890", bankAccountName: "Budi Santoso",
    reviewNotes: "Artikel belum memenuhi kriteria kelayakan.",
    articles: [
      { id: "pi-8", title: "Review Sony WH-1000XM6: Headphone Noise Cancelling Terbaru", amount: 150000 },
    ],
  },
  {
    id: "PO-005", contributor: "Ayu Lestari", contributorEmail: "ayu@contoh.com",
    totalAmount: 250000, totalArticles: 2, status: "PROCESSING",
    requestedAt: "2026-07-16T13:00:00Z", processedAt: "2026-07-18T11:00:00Z", completedAt: null,
    bankName: "Mandiri", bankAccountNumber: "9876543210", bankAccountName: "Ayu Lestari",
    reviewNotes: null,
    articles: [
      { id: "pi-9", title: "5 Framework CSS Terpopuler", amount: 120000 },
      { id: "pi-10", title: "Sejarah dan Evolusi Sistem Operasi Linux", amount: 130000 },
    ],
  },
]

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

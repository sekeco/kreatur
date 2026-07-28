export interface MemberRow {
  id: string
  name: string
  email: string
  role: string
  type: "contributor" | "staff"
  status: "active" | "inactive"
  articleCount?: number
  defaultHonor?: number
  joinedAt: string
}

// ─── Sort & Filter Options ─────────────────────────────

export const sortOptions = [
  { value: "name-asc", label: "Nama A-Z" },
  { value: "name-desc", label: "Nama Z-A" },
  { value: "defaultHonor-desc", label: "Honor Tertinggi" },
  { value: "defaultHonor-asc", label: "Honor Terendah" },
  { value: "joinedAt-desc", label: "Terbaru" },
  { value: "joinedAt-asc", label: "Terlama" },
] as const

export const staffSortOptions = [
  { value: "role-asc", label: "Role A-Z" },
  { value: "role-desc", label: "Role Z-A" },
  ...sortOptions,
] as const

export const filters = {
  status: [
    { value: "all", label: "Semua Status" },
    { value: "active", label: "Aktif" },
    { value: "inactive", label: "Tidak Aktif" },
  ],
  role: [
    { value: "all", label: "Semua Role" },
    { value: "Owner", label: "Owner" },
    { value: "Editor", label: "Editor" },
    { value: "Reviewer", label: "Reviewer" },
    { value: "Finance", label: "Finance" },
  ],
}

export const roleMeta: Record<string, { badgeClass: string; dotClass: string }> = {
  Owner: { badgeClass: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400", dotClass: "bg-violet-500" },
  Editor: { badgeClass: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400", dotClass: "bg-blue-500" },
  Reviewer: { badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400", dotClass: "bg-amber-500" },
  Finance: { badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dotClass: "bg-emerald-500" },
  Contributor: { badgeClass: "border-gray-500/20 bg-gray-500/10 text-gray-600 dark:text-gray-400", dotClass: "bg-gray-500" },
}

export const statusMeta: Record<string, { badgeClass: string; dotClass: string; label: string }> = {
  active: { badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dotClass: "bg-emerald-500", label: "Aktif" },
  inactive: { badgeClass: "border-muted-foreground/30 bg-muted/50 text-muted-foreground", dotClass: "bg-muted-foreground", label: "Tidak Aktif" },
}

// ─── Mock Data ─────────────────────────────────────────

export const contributors: MemberRow[] = [
  { id: "M-001", name: "Budi Santoso", email: "budi@contoh.com", role: "Kontributor", type: "contributor", status: "active", articleCount: 12, defaultHonor: 150000, joinedAt: "2026-01-15T08:00:00Z" },
  { id: "M-002", name: "Ayu Lestari", email: "ayu@contoh.com", role: "Kontributor", type: "contributor", status: "active", articleCount: 8, defaultHonor: 120000, joinedAt: "2026-02-20T10:30:00Z" },
  { id: "M-003", name: "Dimas Ardianto", email: "dimas@contoh.com", role: "Kontributor", type: "contributor", status: "active", articleCount: 15, defaultHonor: 200000, joinedAt: "2026-01-05T09:00:00Z" },
  { id: "M-004", name: "Sari Dewi", email: "sari@contoh.com", role: "Kontributor", type: "contributor", status: "inactive", articleCount: 3, defaultHonor: 50000, joinedAt: "2026-03-10T14:00:00Z" },
  { id: "M-005", name: "Rudi Hermawan", email: "rudi@contoh.com", role: "Kontributor", type: "contributor", status: "active", articleCount: 6, defaultHonor: 130000, joinedAt: "2026-04-01T11:00:00Z" },
  { id: "M-006", name: "Fitriani Nurul", email: "fitri@contoh.com", role: "Kontributor", type: "contributor", status: "active", articleCount: 10, defaultHonor: 160000, joinedAt: "2026-02-01T07:30:00Z" },
  { id: "M-007", name: "Hadi Prasetyo", email: "hadi@contoh.com", role: "Kontributor", type: "contributor", status: "inactive", articleCount: 1, defaultHonor: 50000, joinedAt: "2026-05-15T16:00:00Z" },
  { id: "M-008", name: "Dewi Sartika", email: "dewi@contoh.com", role: "Kontributor", type: "contributor", status: "active", articleCount: 20, defaultHonor: 180000, joinedAt: "2025-11-01T08:00:00Z" },
]

export const staffMembers: MemberRow[] = [
  { id: "M-009", name: "Rina Wijaya", email: "rina@contoh.com", role: "Owner", type: "staff", status: "active", joinedAt: "2025-10-01T08:00:00Z" },
  { id: "M-010", name: "Siti Rahmawati", email: "siti@contoh.com", role: "Editor", type: "staff", status: "active", joinedAt: "2025-10-01T08:00:00Z" },
  { id: "M-011", name: "Agus Wibowo", email: "agus@contoh.com", role: "Reviewer", type: "staff", status: "active", joinedAt: "2025-12-01T09:00:00Z" },
  { id: "M-012", name: "Pak Anton", email: "anton@contoh.com", role: "Finance", type: "staff", status: "active", joinedAt: "2026-01-10T10:00:00Z" },
  { id: "M-013", name: "Lina Marlina", email: "lina@contoh.com", role: "Editor", type: "staff", status: "inactive", joinedAt: "2026-02-01T11:00:00Z" },
  { id: "M-014", name: "Bambang Suprayogi", email: "bambang@contoh.com", role: "Reviewer", type: "staff", status: "active", joinedAt: "2026-03-15T07:00:00Z" },
]

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

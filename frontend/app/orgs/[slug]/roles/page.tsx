"use client"

import {
  type LucideIcon,
  Ban,
  CheckCircle,
  Eye,
  FileEdit,
  Globe,
  Handshake,
  Shield,
  Users,
  Wallet,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Permission {
  icon: LucideIcon
  label: string
  description: string
}

interface RoleInfo {
  name: string
  icon: LucideIcon
  color: string
  description: string
  permissions: Permission[]
}

const roles: RoleInfo[] = [
  {
    name: "Owner",
    icon: Shield,
    color: "text-violet-600 dark:text-violet-400",
    description:
      "Pemilik ruang kerja dengan akses penuh ke semua fitur dan pengaturan.",
    permissions: [
      {
        icon: Users,
        label: "Kelola Anggota",
        description: "Menambah, mengundang, mengeluarkan anggota",
      },
      {
        icon: Shield,
        label: "Kelola Role",
        description: "Mengubah peran dan hak akses anggota",
      },
      {
        icon: FileEdit,
        label: "Kelola Artikel",
        description: "Membaca, menulis, mengedit, menghapus semua artikel",
      },
      {
        icon: Eye,
        label: "Review Artikel",
        description: "Review, setujui, tolak artikel",
      },
      {
        icon: Globe,
        label: "Koneksi WordPress",
        description: "Atur koneksi dan publikasi ke WordPress",
      },
      {
        icon: Wallet,
        label: "Kelola Payout",
        description: "Atur honor, setujui pencairan",
      },
      {
        icon: Handshake,
        label: "Pengaturan",
        description: "Ubah profil workspace, preferensi, dan fitur",
      },
    ],
  },
  {
    name: "Editor",
    icon: FileEdit,
    color: "text-blue-600 dark:text-blue-400",
    description:
      "Mengelola konten, kategori, workflow editorial, dan publikasi.",
    permissions: [
      {
        icon: FileEdit,
        label: "Kelola Artikel",
        description: "Membaca, menulis, mengedit, menghapus semua artikel",
      },
      {
        icon: Eye,
        label: "Review Artikel",
        description: "Review, setujui, tolak artikel",
      },
      {
        icon: Globe,
        label: "Publikasi WordPress",
        description: "Publikasi artikel ke WordPress",
      },
      {
        icon: Users,
        label: "Undang Anggota",
        description: "Mengundang kontributor baru",
      },
      {
        icon: Wallet,
        label: "Atur Honor",
        description: "Mengubah nominal honor per artikel",
      },
    ],
  },
  {
    name: "Reviewer",
    icon: Eye,
    color: "text-amber-600 dark:text-amber-400",
    description: "Menilai dan mereview artikel yang diajukan oleh kontributor.",
    permissions: [
      {
        icon: Eye,
        label: "Review Artikel",
        description: "Membaca artikel yang disubmit untuk review",
      },
      {
        icon: CheckCircle,
        label: "Beri Keputusan",
        description: "Setujui, minta revisi, atau tolak artikel",
      },
      {
        icon: Ban,
        label: "Skor & Catatan",
        description: "Beri skor 1-100 dan catatan review",
      },
    ],
  },
  {
    name: "Kontributor",
    icon: FileEdit,
    color: "text-gray-600 dark:text-gray-400",
    description:
      "Menulis dan mengirim artikel untuk direview. Melihat status dan feedback.",
    permissions: [
      {
        icon: FileEdit,
        label: "Tulis Artikel",
        description: "Membuat dan mengedit artikel sendiri",
      },
      {
        icon: Eye,
        label: "Lihat Feedback",
        description: "Melihat hasil review dan catatan",
      },
      {
        icon: Wallet,
        label: "Ajukan Payout",
        description: "Mengajukan pencairan honor untuk artikel yang disetujui",
      },
    ],
  },
  {
    name: "Finance",
    icon: Wallet,
    color: "text-emerald-600 dark:text-emerald-400",
    description: "Mengelola honor, verifikasi payout, dan pencairan dana.",
    permissions: [
      {
        icon: Wallet,
        label: "Atur Honor",
        description: "Mengubah nominal honor default workspace",
      },
      {
        icon: CheckCircle,
        label: "Verifikasi Payout",
        description: "Setujui atau tolak pengajuan payout",
      },
      {
        icon: Handshake,
        label: "Pencairan",
        description: "Tandai payout sebagai diproses / selesai",
      },
      {
        icon: Ban,
        label: "Upload Bukti",
        description: "Upload bukti transfer pembayaran",
      },
    ],
  },
]

export default function RolesPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-medium">Peran &amp; Hak Akses</h1>
        <p className="text-sm text-muted-foreground">
          Setiap anggota di ruang kerja memiliki peran dengan hak akses yang
          berbeda.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <Card key={role.name}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg border bg-muted">
                    <Icon className={role.color} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {role.permissions.map((perm) => {
                    const PermIcon = perm.icon
                    return (
                      <li key={perm.label} className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-muted">
                          <PermIcon className="size-3 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{perm.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {perm.description}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

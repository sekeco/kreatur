import {
  CircleUser,
  FileText,
  Globe,
  LayoutDashboard,
  Shield,
  Settings,
  Tags,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export interface NavSubItem {
  id: string
  title: string
  url: string
}

export interface NavItem {
  id: string
  title: string
  url: string
  icon: LucideIcon
  subItems?: NavSubItem[]
  /** Daftar role yang boleh melihat menu ini. undefined = semua role */
  roles?: string[]
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

/** Role-based visibility untuk setiap item sidebar */
export const sidebarNavGroups: NavGroup[] = [
  {
    id: "utama",
    label: "Utama",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        // semua role bisa lihat dashboard
      },
    ],
  },
  {
    id: "konten",
    label: "Konten",
    items: [
      {
        id: "artikel",
        title: "Artikel",
        url: "/articles",
        icon: FileText,
        roles: ["owner", "editor", "reviewer", "contributor"],
        subItems: [
          { id: "artikel-semua", title: "Semua Artikel", url: "/articles" },
          { id: "artikel-draft", title: "Draft", url: "/articles?status=DRAFT" },
          {
            id: "artikel-pending",
            title: "Pending Review",
            url: "/articles?status=PENDING_REVIEW",
          },
          {
            id: "artikel-revisi",
            title: "Revisi",
            url: "/articles?status=REVISION_REQUESTED",
          },
          {
            id: "artikel-approved",
            title: "Disetujui",
            url: "/articles?status=APPROVED",
          },
          {
            id: "artikel-ditolak",
            title: "Ditolak",
            url: "/articles?status=REJECTED",
          },
          {
            id: "artikel-terbit",
            title: "Terbit",
            url: "/articles?status=PUBLISHED",
          },
          { id: "artikel-arsip", title: "Arsip", url: "/articles?status=ARCHIVED" },
        ],
      },
      {
        id: "kategori",
        title: "Kategori",
        url: "/categories",
        icon: Tags,
        roles: ["owner", "editor", "reviewer"],
      },
    ],
  },
  {
    id: "keuangan",
    label: "Keuangan",
    items: [
      {
        id: "honor",
        title: "Honor & Payout",
        url: "/payouts",
        icon: Wallet,
        roles: ["owner", "editor", "contributor", "finance"],
      },
    ],
  },
  {
    id: "tim",
    label: "Tim",
    items: [
      {
        id: "anggota",
        title: "Anggota",
        url: "/members",
        icon: Users,
        roles: ["owner", "editor"],
      },
    ],
  },
  {
    id: "pengaturan",
    label: "Pengaturan",
    items: [
      {
        id: "profil",
        title: "Profil Saya",
        url: "/profile",
        icon: CircleUser,
        roles: ["owner", "editor", "reviewer", "contributor", "finance"],
      },
      {
        id: "wordpress",
        title: "WordPress",
        url: "/connections",
        icon: Globe,
        roles: ["owner", "editor"],
      },
      {
        id: "pengaturan",
        title: "Pengaturan",
        url: "/settings",
        icon: Settings,
        roles: ["owner", "editor"],
      },
      {
        id: "roles",
        title: "Peran & Hak Akses",
        url: "/roles",
        icon: Shield,
        roles: ["owner"],
      },
    ],
  },
]

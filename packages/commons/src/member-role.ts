/**
 * Role untuk anggota workspace.
 * Sesuai dengan Better Auth custom roles configuration.
 */
export const MemberRole = {
  OWNER: "owner",
  EDITOR: "editor",
  REVIEWER: "reviewer",
  CONTRIBUTOR: "contributor",
  FINANCE: "finance",
} as const

export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole]

/** Label yang ditampilkan di UI untuk setiap role */
export const MemberRoleLabel: Record<MemberRole, string> = {
  [MemberRole.OWNER]: "Owner",
  [MemberRole.EDITOR]: "Editor",
  [MemberRole.REVIEWER]: "Reviewer",
  [MemberRole.CONTRIBUTOR]: "Kontributor",
  [MemberRole.FINANCE]: "Finance",
}

/** Role yang termasuk tim staf/admin */
export const STAFF_ROLES: MemberRole[] = [
  MemberRole.OWNER,
  MemberRole.EDITOR,
  MemberRole.REVIEWER,
  MemberRole.FINANCE,
]

/** Role yang termasuk kontributor (penulis lepas) */
export const CONTRIBUTOR_ROLES: MemberRole[] = [
  MemberRole.CONTRIBUTOR,
]

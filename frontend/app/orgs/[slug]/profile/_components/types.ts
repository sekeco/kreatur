export interface ProfileData {
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image: string | null
    twoFactorEnabled: boolean
    createdAt: string
  }
  profile: {
    phone: string | null
    bio: string | null
    timezone: string
    locale: string
    bankName: string | null
    bankAccountNumber: string | null
    bankAccountName: string | null
    metadata: Record<string, unknown> | null
  }
  accounts: Array<{
    id: string
    provider: string
    accountId: string
    linkedAt: string
  }>
  hasPassword: boolean
  sessions: Array<{
    id: string
    token: string
    createdAt: string
    userAgent: string | null
    ipAddress: string | null
    expiresAt: string
    isCurrent: boolean
  }>
}

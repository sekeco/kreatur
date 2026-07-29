export interface WorkspaceData {
  id: string
  name: string
  slug: string
  logo: string | null
}

export interface WhiteLabelData {
  logoDark: string | null
  logoLight: string | null
  customDomain: string | null
}

export interface PayoutRulesData {
  defaultHonor: number
  minPayout: number
}

export interface PreferencesData {
  defaultScoreForPublish: number | null
  defaultReviewerId: string | null
  publicJoinEnabled: boolean
  locale: string
}

export interface SettingsData {
  workspace: WorkspaceData
  whiteLabel: WhiteLabelData
  payoutRules: PayoutRulesData
  preferences: PreferencesData
}

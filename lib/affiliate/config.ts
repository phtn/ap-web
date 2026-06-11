export type AffiliateAttributionSource = 'link' | 'qr'

export type AffiliateReferralCookie = {
  code: string
  source: AffiliateAttributionSource
  capturedAt: number
}

export type AffiliateSettingsConfig = {
  enabled: boolean
  cookieLifetimeDays: number
  defaultLandingPath: string
  commissionPercent: number
}

export const AFFILIATE_SETTINGS_IDENTIFIER = 'affiliate-engine'
export const AFFILIATE_SETTINGS_LABEL = 'Affiliate Engine'

export const defaultAffiliateSettings = (): AffiliateSettingsConfig => ({
  enabled: true,
  cookieLifetimeDays: 30,
  defaultLandingPath: '/sign',
  commissionPercent: 10
})

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const readString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)

const readNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const readBoolean = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback)

export const normalizeAffiliateSettings = (value: unknown): AffiliateSettingsConfig => {
  const defaults = defaultAffiliateSettings()
  if (!isRecord(value)) {
    return defaults
  }

  return {
    enabled: readBoolean(value.enabled, defaults.enabled),
    cookieLifetimeDays: Math.max(1, Math.min(365, readNumber(value.cookieLifetimeDays, defaults.cookieLifetimeDays))),
    defaultLandingPath: readString(value.defaultLandingPath, defaults.defaultLandingPath),
    commissionPercent: Math.max(0, Math.min(100, readNumber(value.commissionPercent, defaults.commissionPercent)))
  }
}

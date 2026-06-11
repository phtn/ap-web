import { type GenericDatabaseReader, type GenericDatabaseWriter } from 'convex/server'
import type { DataModel, Id } from '../_generated/dataModel'

type AffiliateCookieInput = {
  code: string
  source: 'link' | 'qr'
  capturedAt: number
}

type AffiliateAttribution = {
  affiliateId: Id<'affiliates'>
  affiliateCode: string
}

const normalizeAffiliateCode = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')

const buildAffiliateCodeBase = (value: string | null | undefined) => {
  const normalized = normalizeAffiliateCode(value ?? '')
  if (normalized.length >= 6) {
    return normalized.slice(0, 10)
  }

  return `${normalized}PROTAP`.slice(0, 10)
}

export const generateUniqueAffiliateCode = async <DB extends GenericDatabaseReader<DataModel>>(
  db: DB,
  identity: { displayName?: string | null; email?: string | null; proId: string }
) => {
  const fallbackFromEmail = identity.email?.split('@')[0] ?? null
  const base = buildAffiliateCodeBase(identity.displayName ?? fallbackFromEmail ?? identity.proId)

  let attempt = 0
  while (attempt < 100) {
    const suffix = attempt === 0 ? '' : `${attempt + 1}`
    const candidate = `${base}${suffix}`.slice(0, 12)
    const existing = await db
      .query('affiliates')
      .withIndex('by_code', (q) => q.eq('code', candidate))
      .first()

    if (!existing) {
      return candidate
    }

    attempt += 1
  }

  return `${base.slice(0, 8)}${identity.proId.slice(-4).toUpperCase()}`
}

export const resolveAffiliateAttribution = async <DB extends GenericDatabaseWriter<DataModel>>(
  db: DB,
  user: {
    _id: Id<'users'>
    proId: string
    email: string
    referredByAffiliateId?: Id<'affiliates'>
  },
  referral: AffiliateCookieInput | undefined
): Promise<AffiliateAttribution | null> => {
  if (user.referredByAffiliateId) {
    return {
      affiliateId: user.referredByAffiliateId,
      affiliateCode: referral?.code ?? ''
    }
  }

  if (!referral?.code) {
    return null
  }

  const affiliateCode = normalizeAffiliateCode(referral.code)
  if (!affiliateCode) {
    return null
  }

  const affiliate = await db
    .query('affiliates')
    .withIndex('by_code', (q) => q.eq('code', affiliateCode))
    .first()

  if (!affiliate || !affiliate.visible || affiliate.status !== 'active') {
    return null
  }

  if (affiliate.userId === user._id) {
    return null
  }

  return {
    affiliateId: affiliate._id,
    affiliateCode: affiliate.code
  }
}

export const attachAffiliateConversion = async <DB extends GenericDatabaseWriter<DataModel>>(
  db: DB,
  args: {
    user: {
      _id: Id<'users'>
      referredByAffiliateId?: Id<'affiliates'>
    }
    purchaseReference: string
    amount: number
    currency: string
  }
) => {
  const affiliateId = args.user.referredByAffiliateId
  if (!affiliateId) {
    return null
  }

  const now = Date.now()

  return now
}

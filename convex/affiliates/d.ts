import {Infer, v} from 'convex/values'

export const affiliateStatus = v.union(
  v.literal('active'),
  v.literal('suspended'),
)

export const affiliateSource = v.union(v.literal('link'), v.literal('qr'))

export const affiliateSchema = v.object({
  userId: v.id('users'),
  proId: v.string(),
  code: v.string(),
  status: affiliateStatus,
  upgradedAt: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
  visible: v.boolean(),
})

export const affiliateClickSchema = v.object({
  affiliateId: v.id('affiliates'),
  affiliateCode: v.string(),
  source: affiliateSource,
  landingPath: v.string(),
  userAgent: v.union(v.string(), v.null()),
  referer: v.union(v.string(), v.null()),
  createdAt: v.number(),
  visible: v.boolean(),
})

export const affiliateReferralSchema = v.object({
  affiliateId: v.id('affiliates'),
  affiliateUserId: v.id('users'),
  affiliateCode: v.string(),
  referredUserId: v.union(v.id('users'), v.null()),
  referredProId: v.union(v.string(), v.null()),
  referredEmail: v.union(v.string(), v.null()),
  source: affiliateSource,
  status: v.union(v.literal('captured'), v.literal('linked')),
  firstTouchedAt: v.number(),
  linkedAt: v.union(v.number(), v.null()),
  purchaseCount: v.number(),
  totalPurchaseAmount: v.number(),
  lastPurchaseAt: v.union(v.number(), v.null()),
  lastPurchaseReference: v.union(v.string(), v.null()),
  visible: v.boolean(),
})

export const affiliateConversionSchema = v.object({
  affiliateId: v.id('affiliates'),
  affiliateReferralId: v.id('affiliateReferrals'),
  referredUserId: v.id('users'),
  purchaseReference: v.string(),
  saleId: v.union(v.id('sales'), v.null()),
  subscriptionId: v.union(v.id('subscriptions'), v.null()),
  amount: v.number(),
  currency: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  visible: v.boolean(),
})

export type Affiliate = Infer<typeof affiliateSchema>
export type AffiliateClick = Infer<typeof affiliateClickSchema>
export type AffiliateReferral = Infer<typeof affiliateReferralSchema>
export type AffiliateConversion = Infer<typeof affiliateConversionSchema>

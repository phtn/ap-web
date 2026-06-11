import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { requireSubject } from '../auth'
import { attachAffiliateConversion, generateUniqueAffiliateCode, resolveAffiliateAttribution } from './lib'

export const upgrade = mutation({
  args: {
    proId: v.string()
  },
  handler: async (ctx, { proId }) => {
    await requireSubject(ctx, proId)
    const user = await ctx.db
      .query('users')
      .withIndex('by_proId', (q) => q.eq('proId', proId))
      .unique()

    if (!user) {
      throw new Error('User not found.')
    }

    const existingAffiliate = await ctx.db
      .query('affiliates')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .first()

    if (existingAffiliate) {
      return existingAffiliate
    }

    const code = await generateUniqueAffiliateCode(ctx.db, {
      displayName: user.displayName,
      email: user.email,
      proId
    })
    const now = Date.now()
    const affiliateId = await ctx.db.insert('affiliates', {
      userId: user._id,
      proId,
      code,
      status: 'active',
      upgradedAt: now,
      createdAt: now,
      updatedAt: now,
      visible: true
    })

    return await ctx.db.get(affiliateId)
  }
})

export const captureClick = mutation({
  args: {
    code: v.string(),
    source: v.union(v.literal('link'), v.literal('qr')),
    landingPath: v.string(),
    userAgent: v.optional(v.union(v.string(), v.null())),
    referer: v.optional(v.union(v.string(), v.null()))
  },
  handler: async (ctx, args) => {
    const code = args.code.trim().toUpperCase()
    const affiliate = await ctx.db
      .query('affiliates')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first()

    if (!affiliate || !affiliate.visible || affiliate.status !== 'active') {
      return null
    }

    return {
      affiliateId: affiliate._id,
      affiliateCode: affiliate.code
    }
  }
})

export const attachUserReferral = mutation({
  args: {
    proId: v.string(),
    referral: v.object({
      code: v.string(),
      source: v.union(v.literal('link'), v.literal('qr')),
      capturedAt: v.number()
    })
  },
  handler: async (ctx, { proId, referral }) => {
    await requireSubject(ctx, proId)
    const user = await ctx.db
      .query('users')
      .withIndex('by_proId', (q) => q.eq('proId', proId))
      .unique()

    if (!user) {
      throw new Error('User not found.')
    }

    const attribution = await resolveAffiliateAttribution(ctx.db, user, referral)
    if (!attribution) {
      return null
    }

    await ctx.db.patch(user._id, {
      referredByAffiliateId: attribution.affiliateId,
      referredByAffiliateCode: attribution.affiliateCode,
      referredAt: Date.now()
    })

    return attribution
  }
})

export const attachConversion = mutation({
  args: {
    proId: v.string(),
    purchaseReference: v.string(),
    amount: v.number(),
    currency: v.string(),
    saleId: v.optional(v.id('sales')),
    subscriptionId: v.optional(v.id('subscriptions'))
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_proId', (q) => q.eq('proId', args.proId))
      .unique()

    if (!user) {
      return null
    }

    return await attachAffiliateConversion(ctx.db, {
      user,
      purchaseReference: args.purchaseReference,
      amount: args.amount,
      currency: args.currency
    })
  }
})

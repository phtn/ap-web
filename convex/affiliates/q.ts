import { v } from 'convex/values'
import { query } from '../_generated/server'
import { requireStaffRoles, requireSubject } from '../auth'

export const getByCode = query({
  args: {
    code: v.string()
  },
  handler: async (ctx, { code }) => {
    return await ctx.db
      .query('affiliates')
      .withIndex('by_code', (q) => q.eq('code', code.trim().toUpperCase()))
      .first()
  }
})

export const getByProId = query({
  args: {
    proId: v.string()
  },
  handler: async (ctx, { proId }) => {
    return await ctx.db
      .query('affiliates')
      .withIndex('by_proId', (q) => q.eq('proId', proId))
      .first()
  }
})

export const getDashboardByProId = query({
  args: {
    proId: v.string()
  },
  handler: async (ctx, { proId }) => {
    await requireSubject(ctx, proId)
    const affiliate = await ctx.db
      .query('affiliates')
      .withIndex('by_proId', (q) => q.eq('proId', proId))
      .first()

    if (!affiliate) {
      return null
    }
  }
})

export const getAdminOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireStaffRoles(ctx, ['admin', 'manager'])
    const affiliates = await ctx.db.query('affiliates').collect()

    const rows = await Promise.all(
      affiliates.map(async (affiliate) => {
        return {
          affiliate
        }
      })
    )

    return rows.reverse()
  }
})

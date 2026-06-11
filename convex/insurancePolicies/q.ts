import { v } from 'convex/values'
import { query } from '../_generated/server'
import { insurancePolicyStatusSchema, insurancePolicyTypeSchema } from './d'

export const get = query({
  args: {
    id: v.id('insurancePolicies')
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  }
})

export const listByType = query({
  args: {
    type: insurancePolicyTypeSchema
  },
  handler: async (ctx, { type }) => {
    return await ctx.db
      .query('insurancePolicies')
      .withIndex('by_type', (q) => q.eq('type', type))
      .collect()
  }
})

export const listByUser = query({
  args: {
    userId: v.id('users')
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('insurancePolicies')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect()
  }
})

export const listByUserAndType = query({
  args: {
    userId: v.id('users'),
    type: insurancePolicyTypeSchema
  },
  handler: async (ctx, { userId, type }) => {
    return await ctx.db
      .query('insurancePolicies')
      .withIndex('by_userId_type', (q) => q.eq('userId', userId).eq('type', type))
      .collect()
  }
})
export const listByProIdAndType = query({
  args: {
    proId: v.string(),
    type: insurancePolicyTypeSchema
  },
  handler: async (ctx, { proId, type }) => {
    return await ctx.db
      .query('insurancePolicies')
      .withIndex('by_proId_type', (q) => q.eq('proId', proId).eq('type', type))
      .collect()
  }
})
export const listByUserAndStatus = query({
  args: {
    userId: v.id('users'),
    status: insurancePolicyStatusSchema
  },
  handler: async (ctx, { userId, status }) => {
    return await ctx.db
      .query('insurancePolicies')
      .withIndex('by_userId_status', (q) => q.eq('userId', userId).eq('status', status))
      .collect()
  }
})

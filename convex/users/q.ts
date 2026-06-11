import {v} from 'convex/values'
import {query} from '../_generated/server'

// Get a single user by ID
export const get = query({
  args: {
    id: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

// List all users (consider pagination for large datasets)
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('users').collect()
  },
})

// Get a user by email (using the 'by_email' index)
export const getByProId = query({
  args: {
    proId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_proId', (q) => q.eq('proId', args.proId))
      .first()
  },
})

// Search users by email or displayName
export const search = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.query || args.query.trim().length === 0) {
      return []
    }

    const searchLower = args.query.toLowerCase().trim()

    // Get all users and filter by search query
    const allUsers = await ctx.db.query('users').collect()

    const matchingUsers = allUsers.filter((u) => {
      const displayName = (u.displayName || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      return (
        displayName.includes(searchLower) ||
        email.includes(searchLower) ||
        email.split('@')[0].includes(searchLower)
      )
    })

    return matchingUsers.slice(0, 10)
  },
})

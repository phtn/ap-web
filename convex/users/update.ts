import {v} from 'convex/values'
import {mutation} from '../_generated/server'

export const update = mutation({
  args: {
    id: v.id('users'),
    email: v.optional(v.string()),
    visible: v.boolean(),
    avatarUrl: v.union(v.string(), v.null()),
    displayName: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const {id, ...rest} = args
    await ctx.db.patch(id, {...rest, updatedAt: Date.now()})
  },
})

export const remove = mutation({
  args: {
    id: v.id('users'),
    visible: v.boolean(),
  },
  handler: async (ctx, args) => {
    const {id, ...rest} = args
    await ctx.db.patch(id, rest)
  },
})

// Delete a user (consider cascading deletes for related data)
export const purge = mutation({
  args: {
    id: v.id('users'),
  },
  handler: async (ctx, args) => {
    // IMPORTANT: Consider what happens to related data (profiles, cards, subscriptions)
    // when a user is deleted. You might want to delete them here too, or prevent deletion.
    await ctx.db.delete(args.id)
  },
})

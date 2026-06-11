import { v } from 'convex/values'
import { query } from '../_generated/server'
import { requireSubject } from '../auth'
// import {requireSubject} from '../auth'

export const get = query({
  args: {
    storageId: v.id('_storage'),
    author: v.string()
  },
  handler: async (ctx, { author, storageId }) => {
    // await requireSubject(ctx, author)

    const file = await ctx.db
      .query('files')
      .withIndex('by_body', (q) => q.eq('body', storageId))
      .unique()

    if (!file || file.author !== author) {
      return null
    }

    return await ctx.storage.getUrl(storageId)
  }
})

/** Resolve a `files` document ID → signed download URL. */
export const getUrlByFileId = query({
  args: {
    fileId: v.id('files'),
    author: v.string()
  },
  handler: async (ctx, { fileId, author }) => {
    await requireSubject(ctx, author)
    const file = await ctx.db.get(fileId)
    if (!file || file.author !== author) return null
    return await ctx.storage.getUrl(file.body)
  }
})

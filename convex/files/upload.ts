import { Infer, v } from 'convex/values'
import { mutation } from '../_generated/server'
import { requireIdentity, requireSubject } from '../auth'

export const fileSchema = v.object({
  body: v.id('_storage'),
  author: v.string(),
  format: v.string(),
  caption: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  uploadedAt: v.optional(v.number())
})

export type UploadType = Infer<typeof fileSchema>

export const url = mutation({
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return await ctx.storage.generateUploadUrl()
  }
})

// export const image = mutation({
//   args: { storageId: v.id('_storage'), author: v.string() },
//   handler: async (ctx, args) => {
//     await requireSubject(ctx, args.author)
//     await ctx.db.insert('images', {
//       body: args.storageId,
//       author: args.author,
//       format: 'image',
//       uploadedAt: Date.now()
//     })
//   }
// })

export const file = mutation({
  args: { storageId: v.id('_storage'), author: v.string() },
  handler: async (ctx, args) => {
    await requireSubject(ctx, args.author)
    await ctx.db.insert('files', {
      body: args.storageId,
      author: args.author,
      format: 'file',
      uploadedAt: Date.now()
    })
  }
})

/** Same as `file` but returns the new document's `Id<'files'>`. */
export const fileAndId = mutation({
  args: { storageId: v.id('_storage'), author: v.string() },
  handler: async (ctx, args) => {
    await requireSubject(ctx, args.author)
    return await ctx.db.insert('files', {
      body: args.storageId,
      author: args.author,
      format: 'file',
      uploadedAt: Date.now()
    })
  }
})

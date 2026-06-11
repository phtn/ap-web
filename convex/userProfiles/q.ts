import { v } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import { query } from '../_generated/server'

type GalleryEntry = {
  fileId: Id<'files'>
  storageId: Id<'_storage'>
  url: string
  author: string | null
  format: string | null
}

// Get a single user profile by ID
export const get = query({
  args: {
    id: v.id('userProfiles')
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  }
})

// Get a user profile by userId (using the 'by_userId' index)
export const getByUserId = query({
  args: {
    userId: v.id('users')
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('userProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .first()
  }
})

// Get a user profile by username (using the 'by_username' index)
export const getByUsername = query({
  args: {
    username: v.string()
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query('userProfiles')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .first()
})

export const getByProId = query({
  args: {
    proId: v.string()
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query('userProfiles')
      .withIndex('by_proId', (q) => q.eq('proId', args.proId))
      .first()
})

// List user profiles (consider pagination)
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('userProfiles').collect()
  }
})

// Get a user profile with associated user data (useful for CardWithRelations-like data)
export const getProfileWithUser = query({
  args: {
    profileId: v.id('userProfiles')
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId)
    if (!profile) return null

    const user = await ctx.db.get(profile.userId)
    return {
      ...profile,
      user // user will be null if not found, handle on client
    }
  }
})

export const getGallery = query({
  args: {
    userId: v.id('users')
  },
  handler: async ({ db, storage }, { userId }) => {
    const profile = await db
      .query('userProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()

    if (!profile || !Array.isArray(profile.gallery) || profile.gallery.length === 0) {
      return [] as GalleryEntry[]
    }

    const uniqueFileIds = Array.from(new Set(profile.gallery))

    const galleryEntries = await Promise.all(
      uniqueFileIds.map(async (fileId): Promise<GalleryEntry | null> => {
        const fileDoc = await db.get(fileId)
        if (!fileDoc || !fileDoc.body) {
          return null
        }

        const url = await storage.getUrl(fileDoc.body)
        if (!url) {
          return null
        }

        return {
          fileId,
          storageId: fileDoc.body,
          url,
          author: fileDoc.author ?? null,
          format: fileDoc.format ?? null
        }
      })
    )

    return galleryEntries.filter((entry): entry is GalleryEntry => entry !== null)
  }
})

export const search = query({
  args: {
    query: v.string()
  },
  handler: async (ctx, args) => {
    if (!args.query) return []

    const cleanQuery = args.query.replace(/^@/, '')

    const promises = [
      ctx.db
        .query('userProfiles')
        .withSearchIndex('search_people', (q) => q.search('displayName', args.query).eq('isPublic', true))
        .take(10),
      ctx.db
        .query('userProfiles')
        .withSearchIndex('search_username', (q) => q.search('username', cleanQuery).eq('isPublic', true))
        .take(10),
      ctx.db
        .query('userProfiles')
        .withSearchIndex('search_company', (q) => q.search('companyName', args.query).eq('isPublic', true))
        .take(10)
    ]

    if (cleanQuery.length >= 2) {
      const prefixQuery = cleanQuery.trim().toLowerCase()
      if (prefixQuery) {
        promises.push(
          ctx.db
            .query('userProfiles')
            .withIndex('by_username', (q) => q.gte('username', prefixQuery).lt('username', prefixQuery + '\uffff'))
            .filter((q) => q.eq(q.field('isPublic'), true))
            .take(10)
        )
      }
    }

    const results = await Promise.all(promises)

    // Merge and deduplicate results
    const allResults = results.flat()
    const seenIds = new Set<string>()
    const uniqueResults = []

    for (const result of allResults) {
      if (!seenIds.has(result._id)) {
        seenIds.add(result._id)
        uniqueResults.push(result)
      }
    }

    return uniqueResults.slice(0, 10)
  }
})

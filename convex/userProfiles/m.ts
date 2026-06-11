import {v} from 'convex/values'
import {v7 as uuidv7} from 'uuid'
import {Id} from '../_generated/dataModel'
import {mutation} from '../_generated/server'
import {
  customLinksSchema,
  fcmSchema,
  socialLinkSchema,
  userProfileSchema,
  userProfileTheme,
} from './d'

// --- Mutations ---

// Create a new user profile
export const create = mutation({
  args: userProfileSchema,
  handler: async (ctx, args) => {
    return await ctx.db.insert('userProfiles', args)
  },
})

// Update an existing user profile
export const update = mutation({
  args: {
    id: v.id('userProfiles'),
    // Only include fields that can be updated, make them optional
    fields: userProfileSchema,
  },
  handler: async (ctx, args) => {
    const {id, fields} = args
    await ctx.db.patch(id, fields)
  },
})

export const updateTheme = mutation({
  args: {
    id: v.id('userProfiles'),
    theme: userProfileTheme,
  },
  handler: async (ctx, {id, theme}) => {
    await ctx.db.patch(id, {theme})
  },
})
export const updateSocialLinks = mutation({
  args: {
    proId: v.string(),
    socialLinks: socialLinkSchema,
    customLinks: v.optional(customLinksSchema),
    companyName: v.optional(v.union(v.string(), v.null())),
    position: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (
    ctx,
    {proId, socialLinks, customLinks, companyName, position},
  ) => {
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_proId', (q) => q.eq('proId', proId))
      .first()
    if (!profile) {
      return null
    }

    const patch: Record<string, unknown> = {
      socialLinks,
      updatedAt: Date.now(),
    }

    if (typeof customLinks !== 'undefined') {
      patch.customLinks = customLinks
    }

    if (typeof companyName !== 'undefined') {
      patch.companyName = normalizeNullableString(companyName)
    }

    if (typeof position !== 'undefined') {
      patch.position = normalizeNullableString(position)
    }

    await ctx.db.patch(profile._id, patch)
    return profile._id
  },
})

export const nullify = mutation({
  args: {
    id: v.id('userProfiles'),
    cardId: v.optional(v.boolean()),
  },
  handler: async (ctx, {id, cardId}) => {
    const profile = await ctx.db.get(id)

    if (!profile) {
      return null
    }

    await ctx.db.patch(profile._id, {
      cardId: cardId ? null : profile.cardId === null ? '' : profile.cardId,
    })
    return profile._id
  },
})

export const updateBasics = mutation({
  args: {
    proId: v.string(),
    username: v.optional(v.union(v.string(), v.null())),
    displayName: v.optional(v.union(v.string(), v.null())),
    bio: v.optional(v.union(v.string(), v.null())),
    companyName: v.optional(v.union(v.string(), v.null())),
    position: v.optional(v.union(v.string(), v.null())),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    {proId, username, displayName, bio, companyName, position, isPublic},
  ) => {
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_proId', (q) => q.eq('proId', proId))
      .first()

    if (!profile) {
      return null
    }

    const patch: Record<string, unknown> = {
      updatedAt: Date.now(),
    }

    if (typeof username !== 'undefined') {
      patch.username = normalizeNullableString(username)
    }

    if (typeof displayName !== 'undefined') {
      patch.displayName = normalizeNullableString(displayName)
    }

    if (typeof bio !== 'undefined') {
      patch.bio = normalizeNullableString(bio)
    }

    if (typeof companyName !== 'undefined') {
      patch.companyName = normalizeNullableString(companyName)
    }

    if (typeof position !== 'undefined') {
      patch.position = normalizeNullableString(position)
    }

    if (typeof isPublic !== 'undefined') {
      patch.isPublic = isPublic
    }

    await ctx.db.patch(profile._id, patch)
    return profile._id
  },
})

const normalizeNullableString = (value: string | null) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return value
}

export const updateGallery = mutation({
  args: {
    id: v.id('userProfiles'),
    file: v.optional(v.id('files')),
    storageId: v.optional(v.id('_storage')),
    author: v.optional(v.string()),
    contentType: v.optional(v.string()),
    setAsAvatar: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const {id, file, storageId, author, contentType, setAsAvatar} = args

    const profile = await ctx.db.get(id)
    if (!profile) {
      return null
    }

    let galleryFileId = file ?? null
    let assetStorageId = storageId ?? null

    if (!galleryFileId && assetStorageId) {
      galleryFileId = await ctx.db.insert('files', {
        body: assetStorageId,
        author: author ?? profile.proId ?? 'system',
        format: contentType ?? 'image',
        uploadedAt: Date.now(),
      })
    }

    if (!galleryFileId) {
      return null
    }

    if (!assetStorageId) {
      const fileDoc = await ctx.db.get(galleryFileId)
      assetStorageId = fileDoc?.body ?? null
    }

    const gallery = profile.gallery ?? []
    if (!gallery.includes(galleryFileId)) {
      gallery.push(galleryFileId)
    }

    const patch: Record<string, unknown> = {
      gallery,
      updatedAt: Date.now(),
    }

    let avatarUrl: string | null = null
    if (setAsAvatar && assetStorageId) {
      avatarUrl = (await ctx.storage.getUrl(assetStorageId)) ?? null
      patch.avatarUrl = avatarUrl
    }

    await ctx.db.patch(profile._id, patch)

    return {
      profileId: profile._id,
      fileId: galleryFileId,
      avatarUrl,
      galleryLength: gallery.length,
    }
  },
})

// Update cover photo
export const updateCoverPhoto = mutation({
  args: {
    id: v.id('userProfiles'),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const {id, storageId} = args

    const profile = await ctx.db.get(id)
    if (!profile) {
      return null
    }

    const coverPhotoUrl = await ctx.storage.getUrl(storageId)

    await ctx.db.patch(id, {
      coverPhotoUrl: coverPhotoUrl ?? undefined,
      updatedAt: Date.now(),
    })

    return {
      profileId: id,
      coverPhotoUrl,
    }
  },
})

// Delete a user profile
export const remove = mutation({
  args: {
    id: v.id('userProfiles'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

// Migrate legacy user data to userProfile
export const migrateFromLegacy = mutation({
  args: {
    profileId: v.id('userProfiles'),
    legacyData: v.object({
      fullName: v.string(),
      photoUrl: v.optional(v.union(v.string(), v.null())),
      photoStorageId: v.optional(v.union(v.id('_storage'), v.null())),
      cardId: v.optional(v.union(v.string(), v.null())),
      position: v.optional(v.union(v.string(), v.null())),
      phone: v.union(v.string(), v.null()),
      profileEmail: v.optional(v.union(v.string(), v.null())),
      socialLinks: v.object({
        facebook: v.union(v.string(), v.null()),
        instagram: v.union(v.string(), v.null()),
        viber: v.union(v.string(), v.null()),
      }),
      gcash: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId)
    if (!profile) {
      return null
    }

    // Map legacy social links to userProfile socialLinks format
    const socialLinks: Record<string, string | undefined> = {
      ...profile.socialLinks,
    }

    if (args.legacyData.socialLinks.facebook) {
      socialLinks.facebook = args.legacyData.socialLinks.facebook
    }
    if (args.legacyData.socialLinks.instagram) {
      socialLinks.instagram = args.legacyData.socialLinks.instagram
    }
    if (args.legacyData.socialLinks.viber) {
      socialLinks.viber = args.legacyData.socialLinks.viber
    }

    // Build patch object with migrated data
    const patch: Record<string, unknown> = {
      updatedAt: Date.now(),
      socialLinks,
    }

    // Update displayName if not already set
    if (!profile.displayName && args.legacyData.fullName) {
      patch.displayName = normalizeNullableString(args.legacyData.fullName)
    }

    // Update avatarUrl if available and not already set
    if (!profile.avatarUrl && args.legacyData.photoUrl) {
      patch.avatarUrl = normalizeNullableString(args.legacyData.photoUrl)
    }

    // Generate UUIDv7 for cardId instead of copying from legacy
    // Only generate if cardId is currently null (indicating migration)
    if (!profile.cardId) {
      patch.cardId = uuidv7()
    }

    // Update position if available
    if (args.legacyData.position) {
      patch.position = normalizeNullableString(args.legacyData.position)
    }

    // Update phone if available
    if (args.legacyData.phone) {
      patch.phone = normalizeNullableString(args.legacyData.phone)
    }

    // Update email if profileEmail is different and available
    if (
      args.legacyData.profileEmail &&
      args.legacyData.profileEmail !== profile.email
    ) {
      patch.email = normalizeNullableString(args.legacyData.profileEmail)
    }

    // Add gcash as custom link if available
    if (args.legacyData.gcash) {
      const customLinks = profile.customLinks ?? []
      const gcashLink = {
        id: `gcash-${Date.now()}`,
        label: 'GCash',
        url: args.legacyData.gcash,
      }
      // Check if gcash link already exists
      const existingGcashIndex = customLinks.findIndex(
        (link) => link.label.toLowerCase() === 'gcash',
      )
      if (existingGcashIndex >= 0) {
        customLinks[existingGcashIndex] = gcashLink
      } else {
        customLinks.push(gcashLink)
      }
      patch.customLinks = customLinks
    }

    // Migrate photoStorageId to gallery
    if (args.legacyData.photoStorageId) {
      const gallery = profile.gallery ?? []

      // Check if a file with this storageId already exists in gallery
      let galleryFileId: string | null = null

      // Check existing files in gallery to see if storageId matches
      for (const fileId of gallery) {
        const fileDoc = await ctx.db.get(fileId)
        if (fileDoc?.body === args.legacyData.photoStorageId) {
          galleryFileId = fileId
          break
        }
      }

      // If not found, create a new file entry
      if (!galleryFileId) {
        galleryFileId = await ctx.db.insert('files', {
          body: args.legacyData.photoStorageId,
          author: profile.proId ?? 'system',
          format: 'image',
          uploadedAt: Date.now(),
        })

        // Add to gallery if not already present
        if (!gallery.includes(galleryFileId as Id<'files'>)) {
          gallery.push(galleryFileId as Id<'files'>)
        }

        patch.gallery = gallery
      }
    }

    await ctx.db.patch(args.profileId, patch)
    return args.profileId
  },
})

export const updateFCM = mutation({
  args: {
    id: v.id('userProfiles'),
    // Only include fields that can be updated, make them optional
    fcm: fcmSchema,
  },
  handler: async ({db}, {id, fcm}) => {
    const userProfile = await db.get(id)
    if (userProfile === null) {
      return
    }

    await db.patch(userProfile._id, {fcm, updatedAt: Date.now()})
  },
})

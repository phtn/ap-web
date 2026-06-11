import { type GenericDatabaseWriter } from 'convex/server'
import { v } from 'convex/values'
import { v7 as uuidv7 } from 'uuid'
import { type DataModel, type Id } from '../_generated/dataModel'
import { mutation } from '../_generated/server'
import { resolveAffiliateAttribution } from '../affiliates/lib'
import { userSchema } from './d'

// -- Create a New User
const create = mutation({
  args: {
    ...userSchema.fields,
    affiliateReferral: v.optional(
      v.object({
        code: v.string(),
        source: v.union(v.literal('link'), v.literal('qr')),
        capturedAt: v.number()
      })
    )
  },
  handler: async ({ db }, args) => {
    const { affiliateReferral, ...userArgs } = args
    const user = await checkUser(db, userArgs.proId)
    if (user !== null) {
      const basePatch: Record<string, unknown> = {
        ...userArgs,
        updatedAt: Date.now()
      }

      const attribution = await resolveAffiliateAttribution(
        db,
        {
          ...user,
          email: user.email
        },
        affiliateReferral
      )

      if (attribution && !user.referredByAffiliateId && !user.affiliateReferralId) {
        basePatch.referredByAffiliateId = attribution.affiliateId
        basePatch.referredByAffiliateCode = attribution.affiliateCode
        basePatch.referredAt = Date.now()
      }

      await db.patch(user._id, basePatch)
      return null
    }

    // Check for pending user to migrate - check gmail first (preferred), then email
    // let pendingUser = null
    const emailToCheck = userArgs.email?.toLowerCase().trim() ?? null

    if (emailToCheck) {
      // Try gmail first (since that's what they'll use to sign in)
      // pendingUser = await db
      //   .query('legacyUsers')
      //   .withIndex('by_gmail', (q) => q.eq('gmail', emailToCheck))
      //   .filter((q) => q.eq(q.field('migratedAt'), null))
      //   .first()
      // Fallback to email if gmail not found
      // if (!pendingUser) {
      //   pendingUser = await db
      //     .query('legacyUsers')
      //     .withIndex('by_email', (q) => q.eq('email', emailToCheck))
      //     .filter((q) => q.eq(q.field('migratedAt'), null))
      //     .first()
      // }
    }

    // Use displayName from pending user if available and current displayName is null
    const displayName = userArgs.displayName

    // Use avatarUrl from pending user if available and current avatarUrl is null
    const avatarUrl = userArgs.avatarUrl ?? null

    const newUser = await db.insert('users', {
      ...userArgs,
      displayName,
      avatarUrl,
      updatedAt: Date.now(),
      createdAt: Date.now()
    })

    // Generate UUIDv7 for cardId (compatible with current table structure)
    // Only generate if we have a legacy user (indicating migration)
    const generatedCardId = uuidv7()

    // Migrate photoStorageId to gallery if available
    const gallery: Id<'files'>[] = []
    // if (pendingUser?.photoStorageId) {
    //   const galleryFileId = await db.insert('files', {
    //     body: pendingUser.photoStorageId,
    //     author: userArgs.proId,
    //     format: 'image',
    //     uploadedAt: Date.now(),
    //   })
    //   gallery.push(galleryFileId)
    // }

    // Create userProfile with legacy data if available
    const profileData: Parameters<typeof db.insert<'userProfiles'>>[1] = {
      userId: newUser,
      proId: userArgs.proId,
      cardId: generatedCardId,
      visible: userArgs.visible,
      email: userArgs.email,
      updatedAt: Date.now(),
      createdAt: Date.now(),
      username: null,
      displayName,
      avatarUrl,
      bio: null,
      phone: null,
      website: null,
      theme: {
        primaryColor: '#FFFFFF',
        backgroundColor: '#000000',
        layoutStyle: 'card'
      },
      socialLinks: {
        facebook: undefined,
        instagram: undefined,
        viber: undefined
      },
      // customLinks: pendingUser?.gcash
      //   ? [
      //       {
      //         id: `gcash-${Date.now()}`,
      //         label: 'GCash',
      //         url: pendingUser.gcash,
      //       },
      //     ]
      //   : [],
      companyName: null,
      // position: pendingUser?.position ?? null,
      isPublic: true,
      showAnalytics: false,
      metaTitle: null,
      metaDescription: null,
      gallery
    }

    const profileId = await db.insert('userProfiles', profileData)

    const newUserDoc = await db.get(newUser)
    if (newUserDoc) {
      const attribution = await resolveAffiliateAttribution(db, newUserDoc, affiliateReferral)

      if (attribution) {
        await db.patch(newUser, {
          referredByAffiliateId: attribution.affiliateId,
          referredByAffiliateCode: attribution.affiliateCode,
          referredAt: Date.now()
        })
      }
    }

    // Mark pending user as migrated if found
    // if (pendingUser) {
    //   await db.patch(pendingUser._id, {
    //     migratedAt: Date.now(),
    //     migratedToProId: userArgs.proId,
    //     updatedAt: Date.now(),
    //   })

    // Note: We no longer activate cards by legacy cardId
    // The new UUIDv7 cardId is generated for the userProfile
    // Card activation should happen separately if needed
    // }

    return profileId
  }
})

const checkUser = async <DB extends GenericDatabaseWriter<DataModel>>(db: DB, proId: string) =>
  await db
    .query('users')
    .withIndex('by_proId', (q) => q.eq('proId', proId))
    .first()

export default create

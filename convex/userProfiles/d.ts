import {Infer, v} from 'convex/values'

export const nullable = v.union(v.string(), v.null())

export const userProfileTheme = v.object({
  primaryColor: v.optional(v.string()),
  backgroundColor: v.optional(v.string()),
  layoutStyle: v.optional(
    v.union(v.literal('minimal'), v.literal('card'), v.literal('list')),
  ),
})

export const socialLinkSchema = v.object({
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  website: v.optional(v.string()),
  facebook: v.optional(v.string()),
  twitter: v.optional(v.string()),
  instagram: v.optional(v.string()),
  tiktok: v.optional(v.string()),
  linkedin: v.optional(v.string()),
  youtube: v.optional(v.string()),
  bluesky: v.optional(v.string()),
  threads: v.optional(v.string()),
  twitch: v.optional(v.string()),
  patreon: v.optional(v.string()),
  kick: v.optional(v.string()),
  viber: v.optional(v.string()),
  whatsapp: v.optional(v.string()),
  telegram: v.optional(v.string()),
  signal: v.optional(v.string()),
  messenger: v.optional(v.string()),
  gcash: v.optional(v.string()),
  maya: v.optional(v.string()),
  gotyme: v.optional(v.string()),
})

export const customLinkSchema = v.object({
  id: v.string(),
  label: v.string(),
  url: v.string(),
})

export const customLinksSchema = v.array(customLinkSchema)

const basics = {
  username: nullable,
  displayName: nullable,
  bio: nullable,
}

export const fcmSchema = v.object({
  token: v.optional(v.string()),
  // Multiple devices: store all active device tokens (best-effort; keep `token` for back-compat).
  tokens: v.optional(v.array(v.string())),
  hasDeclined: v.optional(v.boolean()),
  attempted: v.optional(v.boolean()),
})

export type FCMObject = Infer<typeof fcmSchema>

const props = {
  ...basics,
  proId: v.string(),
  cardId: nullable,
  avatarUrl: nullable,
  email: nullable,
  phone: nullable,
  website: nullable,
  socialLinks: socialLinkSchema,
  customLinks: v.optional(customLinksSchema),
  companyName: v.optional(nullable),
  position: v.optional(nullable),
  isPublic: v.boolean(),
  showAnalytics: v.boolean(),
  coverPhotoUrl: v.optional(v.string()),
  theme: v.optional(userProfileTheme),
  metaTitle: nullable,
  metaDescription: nullable,
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  visible: v.boolean(),
  gallery: v.optional(v.array(v.id('files'))),
  fcm: v.optional(fcmSchema),
}

export const basicsSchema = v.object(basics)
export type UserProfileBasics = Infer<typeof basicsSchema>

export const userProfileSchema = v.object({
  userId: v.id('users'),
  ...props,
})

export const userProfileProps = v.object(props)

export type UserProfile = Infer<typeof userProfileSchema>
export type UserProfileProps = Infer<typeof userProfileProps>

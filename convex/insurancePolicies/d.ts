import { Infer, v } from 'convex/values'

export const insurancePolicyTypeSchema = v.union(
  v.literal('health'),
  v.literal('dental'),
  v.literal('vision'),
  v.literal('life'),
  v.literal('auto'),
  v.literal('home'),
  v.literal('travel'),
  v.literal('pet'),
  v.literal('other'),
  v.literal('pa')
)

export type InsurancePolicyType = Infer<typeof insurancePolicyTypeSchema>

export const insurancePolicyStatusSchema = v.union(
  v.literal('active'),
  v.literal('inactive'),
  v.literal('pending'),
  v.literal('expired'),
  v.literal('cancelled')
)

export type InsurancePolicyStatus = Infer<typeof insurancePolicyStatusSchema>

export const insurancePolicyFieldValueSchema = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
  v.array(v.union(v.string(), v.number(), v.boolean(), v.null()))
)

export type InsurancePolicyFieldValue = Infer<typeof insurancePolicyFieldValueSchema>

export const insurancePolicySchema = v.object({
  userId: v.id('users'),
  proId: v.optional(v.string()),

  // Broad policy classification (kept as literals for type-safety).
  type: insurancePolicyTypeSchema,

  // High-level lifecycle state.
  status: insurancePolicyStatusSchema,

  providerName: v.string(), // carrier / insurer
  planName: v.optional(v.union(v.string(), v.null())),

  policyNumber: v.optional(v.union(v.string(), v.null())),
  memberId: v.optional(v.union(v.string(), v.null())),
  groupNumber: v.optional(v.union(v.string(), v.null())),

  // Store dates as timestamps (ms) for easy sorting/filtering.
  effectiveAt: v.optional(v.union(v.number(), v.null())),
  expiresAt: v.optional(v.union(v.number(), v.null())),

  // Attachments (e.g. policy card PDFs/images stored in `files`).
  attachments: v.optional(v.array(v.id('files'))),

  notes: v.optional(v.union(v.string(), v.null())),
  isPrimary: v.optional(v.boolean()),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  visible: v.boolean(), // Visibility
  fields: v.optional(v.record(v.string(), insurancePolicyFieldValueSchema)),
  payload: v.optional(v.record(v.string(), v.any()))
})

export type InsurancePolicy = Infer<typeof insurancePolicySchema>

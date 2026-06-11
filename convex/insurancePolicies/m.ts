import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import {
  insurancePolicyFieldValueSchema,
  insurancePolicyStatusSchema,
  insurancePolicyTypeSchema,
} from './d'

const normalizeNullableString = (value: string | null | undefined) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return value ?? null
}

export const create = mutation({
  args: {
    userId: v.id('users'),
    proId: v.optional(v.string()),
    type: insurancePolicyTypeSchema,
    status: insurancePolicyStatusSchema,

    providerName: v.string(),
    planName: v.optional(v.union(v.string(), v.null())),

    policyNumber: v.optional(v.union(v.string(), v.null())),
    memberId: v.optional(v.union(v.string(), v.null())),
    groupNumber: v.optional(v.union(v.string(), v.null())),

    effectiveAt: v.optional(v.union(v.number(), v.null())),
    expiresAt: v.optional(v.union(v.number(), v.null())),

    attachments: v.optional(v.array(v.id('files'))),
    notes: v.optional(v.union(v.string(), v.null())),
    isPrimary: v.optional(v.boolean()),

    visible: v.boolean(),
    fields: v.optional(v.record(v.string(), insurancePolicyFieldValueSchema)),
    payload: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    return await ctx.db.insert('insurancePolicies', {
      ...args,
      providerName: args.providerName.trim(),
      planName: normalizeNullableString(args.planName),
      policyNumber: normalizeNullableString(args.policyNumber),
      memberId: normalizeNullableString(args.memberId),
      groupNumber: normalizeNullableString(args.groupNumber),
      notes: normalizeNullableString(args.notes),
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('insurancePolicies'),
    fields: v.object({
      proId: v.optional(v.string()),
      type: v.optional(insurancePolicyTypeSchema),
      status: v.optional(insurancePolicyStatusSchema),

      providerName: v.optional(v.string()),
      planName: v.optional(v.union(v.string(), v.null())),

      policyNumber: v.optional(v.union(v.string(), v.null())),
      memberId: v.optional(v.union(v.string(), v.null())),
      groupNumber: v.optional(v.union(v.string(), v.null())),

      effectiveAt: v.optional(v.union(v.number(), v.null())),
      expiresAt: v.optional(v.union(v.number(), v.null())),

      attachments: v.optional(v.array(v.id('files'))),
      notes: v.optional(v.union(v.string(), v.null())),
      isPrimary: v.optional(v.boolean()),
      visible: v.optional(v.boolean()),
      fields: v.optional(v.record(v.string(), insurancePolicyFieldValueSchema)),
      payload: v.optional(v.record(v.string(), v.any())),
    }),
  },
  handler: async (ctx, {id, fields}) => {
    const patch: Record<string, unknown> = {
      ...fields,
      updatedAt: Date.now(),
    }

    if (typeof fields.providerName !== 'undefined') {
      patch.providerName = fields.providerName.trim()
    }
    if (typeof fields.planName !== 'undefined') {
      patch.planName = normalizeNullableString(fields.planName)
    }
    if (typeof fields.policyNumber !== 'undefined') {
      patch.policyNumber = normalizeNullableString(fields.policyNumber)
    }
    if (typeof fields.memberId !== 'undefined') {
      patch.memberId = normalizeNullableString(fields.memberId)
    }
    if (typeof fields.groupNumber !== 'undefined') {
      patch.groupNumber = normalizeNullableString(fields.groupNumber)
    }
    if (typeof fields.notes !== 'undefined') {
      patch.notes = normalizeNullableString(fields.notes)
    }

    await ctx.db.patch(id, patch)
  },
})

export const remove = mutation({
  args: {
    id: v.id('insurancePolicies'),
  },
  handler: async (ctx, {id}) => {
    await ctx.db.delete(id)
  },
})

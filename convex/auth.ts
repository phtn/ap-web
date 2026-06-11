import { ConvexError } from 'convex/values'
import type { MutationCtx, QueryCtx } from './_generated/server'

type AuthCtx = QueryCtx | MutationCtx
type StaffRole = 'admin' | 'manager'

const UNAUTHORIZED = 'Unauthorized'
const FORBIDDEN = 'Forbidden'

export const requireIdentity = async (ctx: AuthCtx) => {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity?.subject) {
    throw new ConvexError(UNAUTHORIZED)
  }

  return identity
}

export const requireSubject = async (ctx: AuthCtx, expectedProId: string) => {
  const identity = await requireIdentity(ctx)
  if (identity.subject !== expectedProId) {
    throw new ConvexError(FORBIDDEN)
  }

  return identity
}

export const requireStaffRoles = async (ctx: AuthCtx, allowedRoles: StaffRole[] = ['admin']) => {
  const identity = await requireIdentity(ctx)
  console.log(allowedRoles)
  // const normalizedEmail = identity.email?.trim().toLowerCase() ?? null

  const user = await ctx.db
    .query('users')
    .withIndex('by_proId', (q) => q.eq('proId', identity.subject))
    .first()

  // const byUserId =
  //   user?._id !== undefined
  //     ? await ctx.db
  //         .query('staff')
  //         .withIndex('by_userId', (q) => q.eq('userId', user._id))
  //         .first()
  //     : null

  // const staff =
  //   byUserId ??
  //   (normalizedEmail
  //     ? await ctx.db
  //         .query('staff')
  //         .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
  //         .first()
  //     : null)

  // if (!staff?.active) {
  //   throw new ConvexError(FORBIDDEN)
  // }

  // const hasAllowedRole = allowedRoles.some((role) => staff.accessRoles.includes(role))

  // if (!hasAllowedRole) {
  //   throw new ConvexError(FORBIDDEN)
  // }

  return { identity, user }
}

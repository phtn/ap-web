import { Infer, v } from 'convex/values'

export const docTypeSchema = v.union(
  v.literal('check'),
  v.literal('payslip'),
  v.literal('deposit_slip'),
  v.literal('receipt'),
  v.literal('ewallet_transfer'),
  v.literal('invoice'),
  v.literal('cr'),
  v.literal('driver_license'),
  v.literal('passport'),
  v.literal('other')
)

export type DocType = Infer<typeof docTypeSchema>

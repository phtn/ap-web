import { defineSchema, defineTable } from 'convex/server'
import { affiliateSchema } from './affiliates/d'
import { emailSettingsSchema } from './emailSettings/d'
import { fileSchema } from './files/upload'
import { insurancePolicySchema } from './insurancePolicies/d'
import { userProfileSchema } from './userProfiles/d'
import { userSchema } from './users/d'

export default defineSchema({
  users: defineTable(userSchema).index('by_proId', ['proId']),
  userProfiles: defineTable(userProfileSchema)
    .index('by_userId', ['userId'])
    .index('by_proId', ['proId'])
    .index('by_username', ['username'])
    .searchIndex('search_people', {
      searchField: 'displayName',
      filterFields: ['isPublic']
    })
    .searchIndex('search_username', {
      searchField: 'username',
      filterFields: ['isPublic']
    })
    .searchIndex('search_company', {
      searchField: 'companyName',
      filterFields: ['isPublic']
    }),
  affiliates: defineTable(affiliateSchema)
    .index('by_userId', ['userId'])
    .index('by_code', ['code'])
    .index('by_proId', ['proId']),
  insurancePolicies: defineTable(insurancePolicySchema)
    .index('by_userId', ['userId'])
    .index('by_type', ['type'])
    .index('by_userId_type', ['userId', 'type'])
    .index('by_userId_status', ['userId', 'status'])
    .index('by_proId_type', ['proId', 'type']),
  emailSettings: defineTable(emailSettingsSchema).index('by_intent', ['intent']),
  files: defineTable(fileSchema).index('by_body', ['body'])
})

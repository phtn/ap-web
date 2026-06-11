'use client'

import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from 'react'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null

export function InsuranceProviders({ children }: { children: ReactNode }) {
  if (!convexClient) return <NuqsAdapter>{children}</NuqsAdapter>

  return (
    <ConvexProvider client={convexClient}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </ConvexProvider>
  )
}

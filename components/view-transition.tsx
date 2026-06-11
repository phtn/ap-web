'use client'

import type { ReactNode } from 'react'

type ViewTransitionProps = {
  children: ReactNode
  [key: string]: unknown
}

export function ProtapViewTransition({ children }: ViewTransitionProps) {
  return <>{children}</>
}

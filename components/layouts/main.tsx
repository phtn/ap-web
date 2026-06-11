'use client'

import { Toasts } from '@/ctx/toast'
import { PropsWithChildren } from 'react'
import { Topbar } from './topbar'

export default function Container({ children }: PropsWithChildren) {
  // const { on: mobileOpen, setOn: setMobileOpen } = useToggle(false)
  // const { user } = useFirebaseUser()
  // const firstName = user?.displayName?.split(' ').at(0) ?? user?.email ?? 'Account'

  return (
    <div className='min-h-[100dvh] bg-background flex flex-col'>
      <Topbar />

      <main className='mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6'>{children}</main>

      <Toasts />
    </div>
  )
}

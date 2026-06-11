import { Topbar } from '@/components/layouts/topbar'
import type { ReactNode } from 'react'
import { InsuranceProviders } from './providers'

export default function InsuranceLayout({ children }: { children: ReactNode }) {
  return (
    <InsuranceProviders>
      <div className='min-h-dvh bg-background flex flex-col'>
        <Topbar />
        <main className='flex-1'>{children}</main>
      </div>
    </InsuranceProviders>
  )
}

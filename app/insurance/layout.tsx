import { Topbar } from '@/components/layouts/topbar'
import type { ReactNode } from 'react'
import { InsuranceProviders } from './providers'

export default function InsuranceLayout({ children }: { children: ReactNode }) {
  return (
    <InsuranceProviders>
      <div className='min-h-screen bg-background'>
        <Topbar />
        <main>{children}</main>
      </div>
    </InsuranceProviders>
  )
}

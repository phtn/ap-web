'use client'

import { Tab, Tabs } from '@/components/ui/tabs'
import { IconName } from '@/lib/icons'
// import { type IconName } from '@/lib/icons'

export interface NavItem {
  value: string
  label: string
  icon: IconName
}

export const NAV_ITEMS: NavItem[] = [
  { value: '/', label: 'Personal Accident', icon: 'home-line' },
  { value: '/claims', label: 'Claims', icon: 'ticket' },
  { value: '/faq', label: 'FAQs', icon: 'chevrons-right' },
  { value: '/support', label: 'Support', icon: 'chevrons-right' }
]

export function getActiveNavPath(pathname: string) {
  const match = NAV_ITEMS.find((item) => isNavItemActive(pathname, item.value))
  return match?.value ?? NAV_ITEMS[0]?.value ?? '/'
}

export function isNavItemActive(pathname: string, path: string) {
  if (path === '/') {
    return pathname === '/'
  }

  return pathname === path || pathname.startsWith(`${path}/`)
}

interface NavbarProps {
  pathname: string
  items?: NavItem[]
}

export const Navbar = ({ pathname, items = NAV_ITEMS }: NavbarProps) => {
  const activePath = getActiveNavPath(pathname)

  return (
    <nav className='hidden md:flex items-center gap-3'>
      <Tabs key={activePath} tabs={items as Tab[]} />
    </nav>
  )
}

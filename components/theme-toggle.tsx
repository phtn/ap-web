'use client'

import { Icon } from '@/lib/icons'
import { applyTheme } from '@/lib/theme'
import { Button } from './ui/button'

export function ThemeToggle() {
  const handleToggle = () => {
    const root = document.documentElement
    applyTheme(root.classList.contains('dark') ? 'light' : 'dark')
  }

  return (
    <Button
      type='button'
      variant='ghost'
      size='icon-sm'
      className='relative'
      aria-label='Toggle dark mode'
      title='Toggle dark mode'
      onClick={handleToggle}>
      <span className='relative flex size-4 items-center justify-center'>
        <span className='dark:hidden'>
          <Icon name='sun' className='size-4 text-foreground' />
        </span>
        <span className='hidden dark:block'>
          <Icon name='moon' className='size-4 text-foreground' />
        </span>
      </span>
    </Button>
  )
}


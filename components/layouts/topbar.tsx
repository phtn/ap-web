'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Navbar } from './navbar'

export const Topbar = () => {
  const pathname = usePathname()
  return (
    <header className='sticky top-0 z-50 bg-background/1 backdrop-blur-lg'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6'>
        <Link href='/' className='flex items-center gap-4'>
          <div className='relative inline-flex items-center justify-center rounded-2xl'>
            {/*<Icon name='squircle' className='absolute top-0 h-10 w-10 text-primary' />*/}
            <Image
              src='https://res.cloudinary.com/dx0heqhhe/image/upload/v1781107986/ap-wordmark_r3zxco.svg'
              width={578}
              height={148}
              alt='AP Logo'
              className='relative w-auto h-16 aspect-auto text-primary dark:text-white'
            />
          </div>
        </Link>

        <Navbar pathname={pathname} />

        <div className='flex items-center gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant='ghost' size='sm' className='gap-2'>
                  <div className='flex size-5 items-center justify-center rounded-full bg-primary/10'>
                    {/*<Icon name='flag-fill' className='size-3.5 text-primary' />*/}
                  </div>
                  <span className='hidden text-sm sm:inline'></span>
                  {/*<Icon name='chevron-down' className='size-2 opacity-60' />*/}
                </Button>
              }
            />
            <DropdownMenuContent align='end'>
              <DropdownMenuItem className='rounded-sm rounded-t-xl'>{/*<ThemeToggle withLabel />*/}</DropdownMenuItem>
              <DropdownMenuItem className='rounded-sm rounded-b-xl'>{/*<SignOutButton withLabel />*/}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/*<Button variant='ghost' size='icon' className='md:hidden' onClick={() => setMobileOpen((prev) => !prev)}>*/}
          {/*<Icon name={mobileOpen ? 'close' : 'menu'} className='size-4' />*/}
          {/*</Button>*/}
        </div>
      </div>

      {/*{mobileOpen ? <MobileNav pathname={pathname} onNavigate={() => setMobileOpen(false)} /> : null}*/}
    </header>
  )
}

import { PersonalAccidentHeroCard } from '@/app/insurance/pa-hero-card'
import Container from '@/components/layouts/main'
import { Icon } from '@/lib/icons'

export default function Home() {
  return (
    <Container>
      <div className='flex min-h-[calc(100dvh-4rem)] flex-col py-4 sm:py-6 lg:py-10'>
        <PersonalAccidentHeroCard />
        <footer className='mt-auto pt-10 text-xs text-foreground/80'>
          <div className='mt-12 flex h-12 w-full items-center justify-between font-display text-xs font-light'>
            <div className='flex items-center justify-start w-full space-x-2'>
              <Icon name='ap' className='size-4 text-[#0200A1]/70' />
              <span>&copy; {new Date().getFullYear()}</span>
              <span>AutoProtect Insurance Inc.</span>
            </div>
            <div className='flex items-center justify-end w-full'>
              <span className='font-display font-light text-xs space-x-2'>
                <span>Privacy</span> <span>&middot;</span> <span>Terms</span>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </Container>
  )
}

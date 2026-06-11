import { PersonalAccidentHeroCard } from '@/app/insurance/pa-hero-card'
import Container from '@/components/layouts/main'
import { Icon } from '@/lib/icons'

export default function Home() {
  return (
    <Container>
      <div className='py-4 sm:py-6 lg:py-10'>
        <PersonalAccidentHeroCard />
        <footer className='absolute w-[calc(122lvh)] bottom-1 text-xs text-foreground/80'>
          <div className='h-12 mt-12 w-full flex iems-center justify-between font-display font-light text-xs'>
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

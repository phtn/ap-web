import Container from '@/components/layouts/main'
import { PersonalAccidentHeroCard } from '@/components/insurance/pa-hero-card'

export default function Home() {
  return (
    <Container>
      <div className='py-4 sm:py-6 lg:py-10'>
        <PersonalAccidentHeroCard />
      </div>
    </Container>
  )
}

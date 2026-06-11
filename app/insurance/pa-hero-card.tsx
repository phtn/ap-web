import { Benefits } from '@/components/layouts/benefits'
import { buttonVariants } from '@/components/ui/button'
import { Icon } from '@/lib/icons'
import Link from 'next/link'

export function PersonalAccidentHeroCard() {
  return (
    <section className='relative overflow-hidden rounded-4xl border border-border/80 bg-card text-card-foreground shadow-[0_24px_80px_-36px_rgba(15,23,42,0.55)] 2xl:max-h-[calc(75lvh)]'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.12),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.14),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.1),transparent_34%)]' />
      <div className='relative grid gap-0 lg:grid-cols-[1.05fr_0.95fr]'>
        <div className='space-y-4 px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12'>
          <div className='flex items-center gap-3'>
            <div className='flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm backdrop-blur'>
              <Icon name='shield-cross' className='size-8 text-primary' />
            </div>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.28em] text-primary/80 select-none'>
                Personal Accident
              </p>
              <p className='text-sm text-muted-foreground'>Built to protect against sudden life changes</p>
            </div>
          </div>

          <div className='space-y-4'>
            <h1 className='max-w-xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl'>
              Helping and protecting lives.
            </h1>
            <p className='max-w-2xl font-display font-light text-base leading-6 text-muted-foreground sm:text-lg my-6'>
              Accidents can happen at any time. This Personal Accident Insurance is designed to protect you and your PA
              cover with financial support if an unforeseen event leads to bodily injury, disability, or death.
            </p>
          </div>

          <div className='flex flex-wrap gap-2'>
            {[
              'Accidental Death',
              'Permanent Disablement',
              'Medical Reimbursement',
              'Family Support',
              'Liability Cover'
            ].map((item) => (
              <span
                key={item}
                className='rounded-full border border-mauve-100/60 bg-mauve-100 px-3 py-0.5 text-xs font-medium text-foreground/80 backdrop-blur'>
                {item}
              </span>
            ))}
          </div>

          <div className='grid gap-3 sm:grid-cols-3'>
            {[
              { label: '8', value: 'Core benefits' },
              { label: '30 days', value: 'Hospital allowance' },
              { label: '12 months', value: 'Family income support' }
            ].map((stat) => (
              <div key={stat.value} className='rounded-2xl border border-border/70 bg-background/60 p-4 backdrop-blur'>
                <p className='text-2xl font-semibold tracking-tight text-foreground'>{stat.label}</p>
                <p className='mt-1 text-sm text-muted-foreground'>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className='p-4 text-sm italic leading-6 text-muted-foreground'>
            This cover is designed to support you and your family through accidental death, disability, medical
            expenses, income replacement, burial support, and third-party liability.
          </div>

          <div>
            <Link href='/insurance/pa' className={buttonVariants({ variant: 'default', size: '2xl' })}>
              <span>Get started now</span>
              <Icon name='arrow-right' />
            </Link>
          </div>
        </div>

        <div className='border-t border-border/70 bg-background/55 p-6 backdrop-blur lg:border-t-0 lg:border-l lg:p-8'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.28em] text-primary/80 select-none'>Coverage</p>
              <h2 className='mt-2 text-xl font-semibold tracking-tight'>Personal Accident Insurance Coverage</h2>
            </div>
            <div className='rounded-full bg-primary text-white px-3 py-1 text-xs font-medium whitespace-nowrap'>
              8 benefits
            </div>
          </div>

          <div className='mt-6 grid gap-0'>
            <Benefits />
            {/*{coverageItems.map((item, index) => (
              <article
                key={item.title}
                className='group border border-b-0 border-border/70 bg-card/80 p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md'>
                <div className='flex gap-3'>
                  <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
                    {index + 1}
                  </div>
                  <div className='space-y-1'>
                    <h3 className='text-sm font-semibold leading-5 text-foreground'>{item.title}</h3>
                    <p className='text-sm leading-6 text-muted-foreground'>{item.detail}</p>
                  </div>
                </div>
              </article>
            ))}*/}
          </div>
        </div>
      </div>
    </section>
  )
}

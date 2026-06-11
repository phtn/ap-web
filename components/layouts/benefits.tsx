import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function Benefits() {
  return (
    <div className='mx-auto w-full max-w-6xl space-y-4 px-4 pt-8'>
      <Accordion
        className='-space-y-px w-full border-muted rounded-md bg-card shadow dark:bg-card/50'
        collapsible
        defaultValue='item-1'
        type='single'>
        {coverageItems.map((item) => (
          <AccordionItem
            className='relative border-x first:rounded-t-lg first:border-t last:rounded-b-lg last:border-b border-t-foreground/20'
            key={item.id}
            value={item.id}>
            <AccordionTrigger className='font-display text-foreground text-base px-4 py-6 leading-5 hover:no-underline'>
              {item.title}
            </AccordionTrigger>
            <AccordionContent className='px-4 pb-4 text-muted-foreground'>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className='h-12' />
    </div>
  )
}
const coverageItems = [
  {
    id: 'item-1',
    title: 'Accidental Death or Permanent Disablement',
    content: 'Pays up to the sum insured for death or permanent disablement caused by an accident.'
  },
  {
    id: 'item-2',
    title: 'Unprovoked Murder & Assault',
    content: 'Pays 50% of the sum insured for accidental bodily injury or death from unprovoked murder or assault.'
  },
  {
    id: 'item-3',
    title: 'Medical Reimbursement',
    content: 'Pays for medical expenses incurred from accidental bodily injury.'
  },
  {
    id: 'item-4',
    title: 'Burial Assistance',
    content: 'Helps cover funeral expenses following an accidental or natural death.'
  },
  {
    id: 'item-5',
    title: 'Family Income Assistance',
    content: 'Supports the family’s monthly income for 12 months after the principal insured dies in an accident.'
  },
  {
    id: 'item-6',
    title: 'Child Educational Aid',
    content: 'Provides educational aid to each eligible child if the principal insured dies.'
  },
  {
    id: 'item-7',
    title: 'Hospitalization Daily Allowance',
    content: 'Pays a daily income benefit for up to 30 days if hospitalization is due to accident or sickness.'
  },
  {
    id: 'item-8',
    title: 'Personal & Family Liability',
    content:
      'Indemnifies for third-party bodily injury or property damage when the insured or family members are legally liable.'
  }
]

import { CheckboxField, DateField, RadioField, SelectField, TextField } from '@/components/form/fields'
import { FieldConfig, FieldGroup } from '@/components/form/schema'
import { Step } from '@/components/react-bits/stepper'
import { Button } from '@/components/ui/button'
import { Icon, type IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface HeaderProps {
  title: string
  icon: IconName
}
export const Header = ({ title, icon }: HeaderProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between h-16 md:h-14 px-4 md:max-w-7xl md:mx-auto border-x-[0.33px] border-foreground/40',
        {
          'justify-start md:mx-0 bg-foreground/5 md:max-w-6xl w-full border-x-[0.33px]': title
            .toLowerCase()
            .includes('auto')
        }
      )}>
      <div className='w-full flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <Icon name={icon} className='size-6 text-mac-blue opacity-100' />
          <h1 className='text-xl font-semibold tracking-tighter'>
            <span>{title}</span>
          </h1>
        </div>
        <Button size='sm'>
          <span className='flex'>New</span>
        </Button>
      </div>
    </div>
  )
}

interface StepFieldGroupProps<T> {
  group: FieldGroup<T>
  description?: string
  renderField?: (field: FieldConfig<T>) => ReactNode
}

export const StepFieldGroup = <T,>({
  group,
  description,
  renderField: renderFieldOverride
}: StepFieldGroupProps<T>) => {
  const renderField = (field: FieldConfig<T>) => {
    if (renderFieldOverride) return renderFieldOverride(field)
    switch (field.type) {
      case 'checkbox':
        return <CheckboxField key={field.name.toString()} {...field} />
      case 'select':
        return <SelectField key={field.name.toString()} {...field} />
      case 'date':
        return <DateField key={field.name.toString()} {...field} />
      case 'radio':
        return <RadioField key={field.name.toString()} {...field} />
      default:
        return <TextField key={field.name.toString()} {...field} />
    }
  }

  return (
    <Step>
      <div className='space-y-1 py-1 px-1 h-fit border-b-[0.33px] border-foreground/30'>
        <h2 className='text-lg font-semibold tracking-tight font-figtree'>{group.title}</h2>
        {description && <p className='text-sm text-muted-foreground leading-snug'>{description}</p>}
      </div>

      <div className='space-y-5 py-6 px-1'>{group.fields.map(renderField)}</div>
    </Step>
  )
}

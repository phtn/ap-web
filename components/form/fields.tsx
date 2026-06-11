import { HyperList } from '@/components/list'
import { Checkbox } from '@/components/ui/checkbox'
import { ModernInput } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ChangeEvent, HTMLInputTypeAttribute, ReactNode } from 'react'
import { DatePicker } from './date-picker'
import {
  CheckboxFieldConfig,
  DateFieldConfig,
  FieldOption,
  RadioFieldConfig,
  SelectFieldConfig,
  TextAreaFieldConfig,
  TextFieldConfig
} from './schema'

const toLocalISODate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseLocalISODate = (value?: string) => {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (match) {
    const year = Number(match[1])
    const monthIndex = Number(match[2]) - 1
    const day = Number(match[3])
    const date = new Date(year, monthIndex, day)
    return Number.isNaN(date.getTime()) ? undefined : date
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const formatRadioPrice = (price: number) =>
  `₱${price.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

export const TextField = <T,>(item: TextFieldConfig<T>) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    item.onChange?.(event)
    const value = item.type === 'number' ? Number(event.target.value) : event.target.value
    item.validators?.onChange?.(value)
  }

  const isControlled = typeof item.value !== 'undefined'

  return (
    <div className='relative'>
      <LabelSection
        htmlFor={String(item.name)}
        label={item.label}
        helperText={item.helperText}
        required={item.required}
        error={item.error}
        type={item.type}
      />
      <ModernInput
        id={String(item.name)}
        type={item.type}
        inputMode={item.inputMode}
        name={item.name as string}
        spellCheck={item.inputMode === 'search'}
        {...(!isControlled ? { defaultValue: item.defaultValue } : {})}
        placeholder={item.placeholder}
        onChange={handleChange}
        onBlur={item.onBlur}
        {...(isControlled ? { value: item.value } : {})}
        className={cn(
          'w-full text-sm tracking-tight font-medium md:text-base min-h-14 px-5 py-4.5 md:py-7 h-fit rounded-2xl border-[0.33px] dark:border-gray-500/50 outline-none md:placeholded:font-normal',
          item.className
        )}
        autoComplete={item.autoComplete}
      />
    </div>
  )
}

export const TextAreaField = <T,>(item: TextAreaFieldConfig<T>) => {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    item.onChange?.(event)
    item.validators?.onChange?.(event.target.value)
  }

  const isControlled = typeof item.value !== 'undefined'

  return (
    <div className='relative'>
      <LabelSection
        htmlFor={String(item.name)}
        label={item.label}
        helperText={item.helperText}
        required={item.required}
        error={item.error}
      />
      <textarea
        name={item.name as string}
        spellCheck={false}
        rows={item.rows ?? 4}
        {...(!isControlled ? { defaultValue: item.defaultValue } : {})}
        placeholder={item.placeholder}
        onChange={handleChange}
        onBlur={item.onBlur}
        {...(isControlled ? { value: item.value } : {})}
        className={cn(
          'w-full text-sm tracking-tight font-semibold md:text-base min-h-14 px-5 py-4.5 md:py-7 h-fit rounded-2xl border-[0.33px] dark:border-gray-500/50 outline-none md:placeholded:font-normal resize-y',
          'bg-background dark:bg-background/25 border border-origin dark:border-zinc-700',
          'placeholder:text-muted-foreground/80 placeholder:tracking-tight',
          'focus-visible:ring-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'dark:focus-visible:ring-primary-hover/50 ring-offset-background',
          item.mono && 'font-mono text-xs leading-relaxed',
          item.className
        )}
      />
    </div>
  )
}

export const SelectField = <T,>(item: SelectFieldConfig<T>) => {
  const isControlled = typeof item.value !== 'undefined'
  const rawValue = isControlled ? item.value : item.defaultValue
  const currentValue = rawValue !== undefined ? String(rawValue) : undefined

  return (
    <div className='relative pb-2'>
      <LabelSection
        htmlFor={String(item.name)}
        label={item.label}
        helperText={item.helperText}
        required={item.required}
        error={item.error}
      />
      <Select
        name={item.name as string}
        {...(isControlled ? { value: currentValue } : { defaultValue: currentValue })}
        onValueChange={(value) => {
          // Call handleChange if provided (for form state updates)
          item.handleChange?.(value)
          // Call validators for validation
          item.validators?.onChange(value)
        }}>
        <SelectTrigger
          size='default'
          className='min-h-14 h-fit ps-5 py-4 cursor-pointer rounded-2xl dark:bg-background/25 bg-white border-[0.33px] border-gray-500/50 outline-none text-left w-full tracking-tight'>
          <SelectValue placeholder={item.placeholder ?? 'Select an option'} className='h-full placeholder:text-base ' />
        </SelectTrigger>
        <SelectContent className='w-full rounded-2xl border-gray-400 [&_*[role=option]]:ps-3 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:inset-s-auto [&_*[role=option]>span]:inset-e-4'>
          <HyperList
            data={item.options}
            component={SelectFieldItem}
            itemStyle='border-b border-origin/0 last:border-none p-1'
            keyId='value'
          />
        </SelectContent>
      </Select>
    </div>
  )
}

const SelectFieldItem = ({ value, icon, label, description, iconStyle, disabled = false }: FieldOption) => (
  <SelectItem
    value={value}
    disabled={disabled}
    className={cn('h-fit py-4 md:py-7 font-medium font-quick cursor-pointer focus:text-panel hover:border-0', {
      'cursor-not-allowed': disabled
    })}>
    <div className='flex items-start gap-x-2'>
      <Icon name={icon} className={cn('size-5', iconStyle, disabled && 'opacity-50')} />
      <div className='flex flex-col justify-start'>
        <span
          className={cn('block text-sm tracking-tight font-semibold', {
            'opacity-50': disabled
          })}>
          {label}
        </span>
        <span className='block text-xs font-sans font-normal opacity-60'>{description}</span>
      </div>
    </div>
  </SelectItem>
)
export const CheckboxField = <T,>(item: CheckboxFieldConfig<T>) => {
  const isControlled = typeof item.value === 'boolean'

  return (
    <div className={cn('flex flex-col gap-1 py-3', item.className)}>
      <div className='flex items-center justify-between gap-3 font-figtree tracking-tight'>
        {item.label && (
          <label htmlFor={String(item.name)} className='text-sm font-medium leading-none'>
            {item.label}
          </label>
        )}

        <Checkbox
          id={String(item.name)}
          name={String(item.name)}
          disabled={item.disabled}
          checked={isControlled ? item.value : undefined}
          defaultChecked={!isControlled ? (item.defaultValue ?? false) : undefined}
          onCheckedChange={(checked) => {
            const next = checked === true
            item.onCheckedChange?.(next)
            item.validators?.onChange?.(next)
          }}
          className='size-5'
        />
      </div>

      {item.helperText && <div className='text-xs text-muted-foreground'>{item.helperText}</div>}
      {item.error && <span className='text-xs text-mac-red'>{item.error}</span>}
    </div>
  )
}

export const RadioField = <T,>(item: RadioFieldConfig<T>) => {
  const isControlled = typeof item.value !== 'undefined'
  const rawValue = isControlled ? item.value : (item.defaultValue as string | number | undefined)
  const currentValue = rawValue !== undefined ? String(rawValue) : undefined

  return (
    <div className='relative pb-2'>
      <LabelSection
        htmlFor={String(item.name)}
        label={item.label}
        helperText={item.helperText}
        required={item.required}
        error={item.error}
      />
      <RadioGroup
        name={item.name as string}
        value={currentValue ?? undefined}
        onValueChange={(value) => {
          item.onValueChange?.(value)
          item.validators?.onChange?.(value)
        }}
        className='space-y-3'>
        {item.options.map((option) => {
          const price = typeof option.price === 'number' ? formatRadioPrice(option.price) : option.price
          return (
            <div
              key={option.value}
              className={cn(
                'flex items-center space-x-3 rounded-2xl border p-4 transition-colors',
                'border-foreground/45 bg-foreground/3',
                'hover:border-mac-blue hover:bg-mac-blue/10',
                option.disabled && 'opacity-50 cursor-not-allowed',
                {
                  'bg-mac-blue dark:bg-mac-blue text-white border-white dark:hover:border-white dark:hover:bg-mac-blue/80 hover:bg-mac-blue':
                    option.value === currentValue
                }
              )}>
              <RadioGroupItem
                value={option.value}
                id={`${String(item.name)}-${option.value}`}
                disabled={option.disabled}
                className={cn('mt-0.5', {
                  'text-white border-white': option.value === currentValue
                })}
              />
              <label htmlFor={`${String(item.name)}-${option.value}`} className='flex-1 cursor-pointer font-okxs'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='text-sm md:text-base font-medium tracking-tight'>{option.label}</div>
                    {option.description && <div className='text-xs opacity-80 mt-0.5'>{option.description}</div>}
                  </div>
                  {price && (
                    <div
                      className={cn('text-sm md:text-lg flex items-start justify-end font-medium -mt-4 text-mac-blue', {
                        'text-white': option.value === currentValue
                      })}>
                      {price}
                    </div>
                  )}
                </div>
              </label>
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}

export const DateField = <T,>(item: DateFieldConfig<T>) => {
  const selected = parseLocalISODate(item.value ?? item.defaultValue)

  return (
    <div className='relative'>
      <LabelSection
        htmlFor={String(item.name)}
        label={item.label}
        helperText={item.helperText}
        required={item.required}
        error={item.error}
      />

      {/* Keep a real input for native form submissions */}
      <input type='hidden' name={item.name as string} value={item.value ?? item.defaultValue ?? ''} />

      <DatePicker
        id={String(item.name)}
        disabled={item.disabled}
        placeholder={item.placeholder ?? 'Select date'}
        className={item.className}
        buttonClassName={cn(
          'w-full justify-between text-sm tracking-tight font-semibold md:text-base min-h-14 px-5 h-fit rounded-2xl border-[0.33px] dark:border-gray-500/50 outline-none active:scale-98'
        )}
        value={selected}
        onChange={(next) => {
          const nextValue = next ? toLocalISODate(next) : undefined
          item.onDateChange?.(nextValue)
          item.validators?.onChange?.(nextValue ?? '')
        }}
      />
    </div>
  )
}

export const FileField = <T,>(item: TextFieldConfig<T>) => {
  // const onChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   if (item.type === 'file') {
  //     return event.target.files?.[0]
  //   }
  // }
  return (
    <ModernInput
      type={item.type}
      inputMode={item.inputMode}
      name={item.name as string}
      defaultValue={item.defaultValue}
      placeholder={item.placeholder}
      className='w-full text-sm tracking-tight font-semibold md:text-base min-h-14 px-5 py-4.5 md:py-7 h-fit rounded-2xl border-[0.33px] dark:border-gray-500/50 outline-none'
    />
  )
}

interface LabelSectionProps {
  htmlFor: string
  label?: string
  helperText?: ReactNode
  required?: boolean
  error?: ReactNode
  type?: HTMLInputTypeAttribute
}
export const LabelSection = ({ htmlFor, label, helperText, required, error, type }: LabelSectionProps) => (
  <div className='flex items-center'>
    <div
      className={cn('ps-1 mb-2 font-figtree flex items-center text-xs md:text-sm', {
        'items-start flex-col': type === 'file'
      })}>
      <label
        htmlFor={htmlFor}
        className='flex items-center justify-between font-semibold tracking-tight whitespace-nowrap pr-3 text-sm opacity-80'>
        <div className='flex items-center'>
          {label}
          <Icon
            name={required ? 'asterisk' : 'information'}
            className={cn('size-3.5 md:size-3.5 ml-2 translate-y-[1.35px] opacity-20', {
              'text-rose-500 dark:text-rose-400 ml-0 -rotate-6 opacity-100 mb-0': required
            })}
          />
        </div>
        {error && type === 'file' && (
          <span className='text-right text-xs text-rose-500 dark:text-rose-400 px-2'>{error}</span>
        )}
      </label>

      {/*<div className={cn('flex items-center tracking-tight gap-2')}>*/}
      {helperText && <div className='opacity-80 text-xs md:text-sm leading-tight'>{helperText}</div>}
      {/*</div>*/}
      {error && type !== 'file' && (
        <span className='text-right text-xs text-rose-500 dark:text-rose-400 px-2'>{error}</span>
      )}
    </div>
  </div>
)

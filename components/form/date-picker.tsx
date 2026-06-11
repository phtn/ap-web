'use client'

import * as React from 'react'

import {Button} from '@/components/ui/button'
import {Calendar} from '@/components/ui/calendar'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'

export interface DatePickerProps {
  value?: Date
  defaultValue?: Date
  onChange?: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  buttonClassName?: string
  id?: string
}

export function DatePicker({
  value,
  defaultValue,
  onChange,
  disabled,
  placeholder = 'Select date',
  className,
  buttonClassName,
  id = 'date',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const isControlled = value !== undefined
  const [uncontrolledDate, setUncontrolledDate] = React.useState<
    Date | undefined
  >(defaultValue)

  const date = isControlled ? value : uncontrolledDate

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            id={id}
            disabled={disabled}
            className={cn('w-48 justify-between font-normal', buttonClassName)}>
            {date ? date.toLocaleDateString() : placeholder}
            <Icon name='chevron-down' className='size-4' />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='relative z-80 w-72 px-3 py-3.5 font-figtree font-semibold bg-white dark:bg-zinc-800/95 backdrop-blur-sm border-[0.33px] border-zinc-300 dark:border-zinc-800/60 rounded-3xl shadow-xl shadow-zinc-900/5 dark:shadow-zinc-950/20 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-top-right'
          align='start'>
          <Calendar
            mode='single'
            selected={date}
            captionLayout='dropdown'
            onSelect={(date) => {
              if (!isControlled) setUncontrolledDate(date)
              onChange?.(date)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

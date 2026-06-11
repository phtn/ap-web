import { Icon, IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ClassName } from '@/types'
import { type ComponentProps, forwardRef } from 'react'

type ValidatorFn = (value: string | number) => true | string
export type InputProps = ComponentProps<'input'> & {
  validators?: Record<string, ValidatorFn>
}

function Input({
  className,
  type,
  icon,
  iconStyle,
  ...props
}: ComponentProps<'input'> & { icon?: IconName; iconStyle?: ClassName }) {
  return (
    <div className='relative flex items-center'>
      {icon && <Icon name={icon} className={cn('size-5 top-3.5 left-3 absolute', iconStyle)} />}
      <input
        type={type}
        data-slot='input'
        className={cn(
          'flex h-12 w-full min-w-0 bg-input/20 dark:bg-card/10',
          'text-base dark:text-white md:text-lg font-medium font-figtree',
          'pl-3 pr-12 py-1 border-slate-400/80 dark:border-zinc-500 border outline-none rounded-lg',
          'selection:bg-sky-300/80 dark:selection:text-zinc-800 selection:text-foreground',
          'shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground',
          'file:text-foreground file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'focus-visible:border-ring dark:focus-visible:ring-cyan-100/60 focus-visible:ring-ring/40 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          { 'pl-11': icon },
          className
        )}
        {...props}
      />
    </div>
  )
}

const ModernInput = forwardRef<HTMLInputElement, InputProps>((inputProps, ref) => {
  const { className, validators: _validators, value, defaultValue, ...props } = inputProps
  // Check if value prop was provided (controlled component)
  const isControlled = 'value' in inputProps
  return (
    <div className='flex items-center space-x-2'>
      <input
        itemScope={!_validators}
        {...props}
        ref={ref}
        {...(isControlled ? { value: value ?? '' } : { defaultValue })}
        className={cn(
          'flex md:h-14 h-9 w-full rounded-lg px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-xs shadow-2xs',
          ' bg-greyed/5 dark:bg-background/25 border border-origin dark:border-zinc-700',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          'placeholder:text-muted-foreground/80 placeholder:tracking-tight ',
          'focus-visible:ring-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'dark:focus-visible:ring-primary-hover/50 ring-offset-background',
          className
        )}
      />
    </div>
  )
})

ModernInput.displayName = 'ModernInput'

function FlatInput({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'flex h-12 w-full min-w-0 bg-input/20 dark:bg-card/10',
        'text-base dark:text-white md:text-lg font-medium,',
        'pl-3 pr-12 py-1 border-slate-400/80 dark:border-zinc-400 outline-none rounded-lg',
        'selection:bg-sky-300/80 dark:selection:text-zinc-800 selection:text-foreground',
        'transition-[color,box-shadow] placeholder:text-muted-foreground',
        'file:text-foreground file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring dark:focus-visible:ring-cyan-100/60 focus-visible:ring-ring/40 focus-visible:ring-px',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        '',
        className
      )}
      {...props}
    />
  )
}

export { FlatInput, Input, ModernInput }

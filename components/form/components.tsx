import { cn } from '@/lib/utils'
import { ClassName } from '@/types'
import { AnyFieldApi } from '@tanstack/react-form'
import { Button } from '../ui/button'

// Helper to extract error messages from TanStack Form errors (which can be objects or strings)
export function getErrorMessage(errors: unknown[]): string | undefined {
  if (!errors || errors.length === 0) return undefined

  const messages = errors
    .map((err) => {
      if (typeof err === 'string') return err
      if (err && typeof err === 'object') {
        // Handle Zod-style errors with message property
        if ('message' in err && typeof err.message === 'string') {
          return err.message
        }
        // Handle nested validation errors
        if ('issues' in err && Array.isArray((err as { issues: unknown[] }).issues)) {
          return (err as { issues: { message: string }[] }).issues.map((issue) => issue.message).join(', ')
        }
      }
      return null
    })
    .filter(Boolean)

  return messages.length > 0 ? messages.join(', ') : undefined
}

export const FieldInfo = ({ field }: { field: AnyFieldApi }) => {
  const errorMessage =
    field.state.meta.isTouched && field.state.meta.errors.length ? getErrorMessage(field.state.meta.errors) : null

  return (
    <>
      {errorMessage ? <em>{errorMessage}</em> : null}
      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  )
}

interface SubmitButtonProps {
  pending: boolean
  className?: ClassName
  label?: string
}

export const SubmitButton = ({ pending, className, label }: SubmitButtonProps) => {
  return (
    <Button
      type='submit'
      disabled={pending}
      variant='ghost'
      className={cn(
        'md:px-12 shadow-none bg-transparent dark:hover:bg-primary-hover hover:bg-primary hover:text-white text-foreground dark:inset-shadow-[0_1px_rgb(160_160_160)]/0 inset-shadow-[0_1px_rgb(160_160_160)]/0',
        className
      )}>
      <span className=' md:text-lg'>{pending ? 'Saving...' : (label ?? 'Submit')}</span>
    </Button>
  )
}

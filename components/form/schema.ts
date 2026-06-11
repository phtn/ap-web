import { IconName } from '@/lib/icons'
import { ClassName } from '@/types'
import { ChangeEvent, FocusEvent, HTMLInputTypeAttribute, ReactNode } from 'react'

// Define option type for selects and checkbox groups

type InputMode = 'search' | 'text' | 'email' | 'tel' | 'url' | 'none' | 'numeric' | 'decimal' | undefined
export type UserFieldName = 'name' | 'tel' | 'email' | 'inquiry'

// Type for field validators
export type FieldValue = string | number
export type AnyFieldValue = FieldValue | boolean
export type FieldValidator = (value: AnyFieldValue) => true | string

export type KeysMatching<T, V> = {
  [K in keyof T]-?: Exclude<T[K], null | undefined> extends V ? K : never
}[keyof T]

// Define base field properties
export interface BaseFieldConfig<T> {
  name: keyof T
  error?: false | string
  label?: string
  value?: FieldValue
  defaultValue?: FieldValue
  required?: boolean
  autoComplete?: string
  placeholder?: string
  helperText?: ReactNode
  validators?: Record<string, FieldValidator>
  className?: string
  disabled?: boolean
  type?: HTMLInputTypeAttribute
  inputMode?: InputMode
  onChange?: ((event: ChangeEvent<HTMLInputElement>) => void) | ((value: unknown) => void)
  onBlur?: ((event: FocusEvent<HTMLInputElement>) => void) | ((...args: unknown[]) => void)
}

// Text field config
export interface TextFieldConfig<T> extends BaseFieldConfig<T> {
  type: 'text' | 'email' | 'number' | 'password' | 'tel' | 'file'
}

export interface TextAreaFieldConfig<T> extends Omit<
  BaseFieldConfig<T>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'onBlur'
> {
  type: 'textarea'
  value?: string
  defaultValue?: string
  rows?: number
  mono?: boolean
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void
  onBlur?: (event: FocusEvent<HTMLTextAreaElement>) => void
}

export type FieldOption = {
  value: string
  label: string
  icon: IconName
  description?: string
  iconStyle?: ClassName
  disabled?: boolean
}
// Select field config
export interface SelectFieldConfig<T> extends BaseFieldConfig<T> {
  type: 'select'
  options: FieldOption[]
  handleChange?: (value: string) => void
  // onValueChange: (value: string) => void;
}

export interface CheckboxFieldConfig<T> extends Omit<BaseFieldConfig<T>, 'value' | 'defaultValue' | 'onChange'> {
  type: 'checkbox'
  name: KeysMatching<T, boolean>
  value?: boolean
  defaultValue?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export interface DateFieldConfig<T> extends Omit<
  BaseFieldConfig<T>,
  'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'type' | 'inputMode'
> {
  type: 'date'
  /**
   * Stored as a local date string (`YYYY-MM-DD`) to avoid timezone shifts.
   */
  value?: string
  defaultValue?: string
  onDateChange?: (value: string | undefined) => void
}

export type RadioFieldOption = {
  value: string
  label: string
  price?: string | number
  description?: string
  disabled?: boolean
}

export interface RadioFieldConfig<T> extends BaseFieldConfig<T> {
  type: 'radio'
  options: RadioFieldOption[]
  onValueChange?: (value: string) => void
}

// Union type for all field types
export type FieldConfig<T> =
  | TextFieldConfig<T>
  | SelectFieldConfig<T>
  | CheckboxFieldConfig<T>
  | DateFieldConfig<T>
  | RadioFieldConfig<T>

// Type for field groups
export interface FieldGroup<T> {
  title: string
  fields: FieldConfig<T>[]
}

export interface ISelectFieldItem extends FieldOption {
  id: string
  name: string
}

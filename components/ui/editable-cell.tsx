'use client'

type EditableCellProps = {
  label?: string
  value?: string
  onChangeAction?: (value: string) => void
  className?: string
}

export function EditableCell(_props: EditableCellProps) {
  return <>{_props.label ?? null}</>
}

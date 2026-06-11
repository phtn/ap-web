import { useState } from 'react'

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial)
  return { value, setValue, toggle: () => setValue((current) => !current), on: value } as const
}

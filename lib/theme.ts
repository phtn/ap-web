export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'ap-web-theme'

export const themeInitScript = `
(() => {
  const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)}
  const root = document.documentElement
  let stored = null

  try {
    stored = localStorage.getItem(storageKey)
  } catch {}

  const theme = stored === 'light' || stored === 'dark' ? stored : 'light'

  root.dataset.theme = theme
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
})()
`

export function applyTheme(theme: Theme) {
  const root = document.documentElement

  root.dataset.theme = theme
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {}
}

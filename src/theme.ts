import type { Mode, Theme } from './types'

export const resolveMode = (mode: Mode): 'light' | 'dark' => {
  if (mode === 'light' || mode === 'dark') return mode
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const applyTheme = (mode: Mode, theme: Theme) => {
  const resolved = resolveMode(mode)
  document.body.dataset.mode = resolved
  document.body.dataset.theme = theme
}

export const onSystemThemeChange = (cb: () => void) => {
  const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (!mql) return () => {}
  const handler = () => cb()
  mql.addEventListener('change', handler)
  return () => mql.removeEventListener('change', handler)
}

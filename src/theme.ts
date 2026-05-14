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

export const themeLabel: Record<Theme, string> = {
  classic: '经典',
  sand: '沙',
  sage: '苔',
  slate: '岩',
  ocean: '海',
  forest: '林',
  sunset: '暮',
  highContrast: '高对比',
}

export const themeDescription: Record<Theme, string> = {
  classic: '默认配色',
  sand: '温暖沙色调',
  sage: '清新绿植风',
  slate: '冷峻岩石风',
  ocean: '深邃海洋蓝',
  forest: '自然森林绿',
  sunset: '浪漫夕阳橙',
  highContrast: '色弱友好',
}

import type { GameSnapshot, Settings, Stats } from './types'

const KEY_SETTINGS = 'sudoku.settings.v1'
const KEY_GAME = 'sudoku.game.v1'
const KEY_STATS = 'sudoku.stats.v1'

const safeParse = <T>(value: string | null): T | null => {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing old data')
      try {
        localStorage.removeItem('sudoku.game.v1')
        localStorage.setItem(key, value)
        return true
      } catch {
        return false
      }
    }
    console.warn('localStorage write failed:', e)
    return false
  }
}

export const loadSettings = (): Settings | null =>
  safeParse<Settings>(localStorage.getItem(KEY_SETTINGS))

export const saveSettings = (s: Settings) => {
  safeSetItem(KEY_SETTINGS, JSON.stringify(s))
}

export const loadGame = (): GameSnapshot | null =>
  safeParse<GameSnapshot>(localStorage.getItem(KEY_GAME))

export const saveGame = (g: GameSnapshot) => {
  safeSetItem(KEY_GAME, JSON.stringify(g))
}

export const clearGame = () => {
  localStorage.removeItem(KEY_GAME)
}

export const loadStats = (): Stats | null =>
  safeParse<Stats>(localStorage.getItem(KEY_STATS))

export const saveStats = (s: Stats) => {
  safeSetItem(KEY_STATS, JSON.stringify(s))
}

export const clearAll = () => {
  localStorage.removeItem(KEY_SETTINGS)
  localStorage.removeItem(KEY_GAME)
  localStorage.removeItem(KEY_STATS)
}

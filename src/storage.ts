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

export const loadSettings = (): Settings | null =>
  safeParse<Settings>(localStorage.getItem(KEY_SETTINGS))

export const saveSettings = (s: Settings) => {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(s))
}

export const loadGame = (): GameSnapshot | null =>
  safeParse<GameSnapshot>(localStorage.getItem(KEY_GAME))

export const saveGame = (g: GameSnapshot) => {
  localStorage.setItem(KEY_GAME, JSON.stringify(g))
}

export const clearGame = () => {
  localStorage.removeItem(KEY_GAME)
}

export const loadStats = (): Stats | null =>
  safeParse<Stats>(localStorage.getItem(KEY_STATS))

export const saveStats = (s: Stats) => {
  localStorage.setItem(KEY_STATS, JSON.stringify(s))
}

export const clearAll = () => {
  localStorage.removeItem(KEY_SETTINGS)
  localStorage.removeItem(KEY_GAME)
  localStorage.removeItem(KEY_STATS)
}

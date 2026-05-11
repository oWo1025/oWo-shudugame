import type { Settings, Stats } from './types'

export const defaultSettings = (): Settings => ({
  mode: 'system',
  theme: 'classic',
  vibration: true,
  sound: true,
  realtimeErrors: true,
  autoCandidates: false,
  inputMode: 'cellFirst',
  keyboardSide: 'right',
  cloudSync: false,
})

export const defaultStats = (): Stats => ({
  version: 1,
  totalTimeSec: 0,
  totalCompleted: 0,
  completedByDifficulty: {
    beginner: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
    hell: 0,
  },
  hintsUsed: 0,
  errors: 0,
  bestTimeSec: {},
  avgTimeSec: {},
  dailyStreak: 0,
  dailyBestStreak: 0,
  dailyLastDate: null,
  noErrorCompletions: 0,
  noHintCompletions: 0,
  achievements: {},
})

export type Mode = 'system' | 'light' | 'dark'
export type Theme = 'classic' | 'sand' | 'sage' | 'slate'
export type KeyboardSide = 'left' | 'right'
export type InputMode = 'cellFirst' | 'numberFirst'

export type Difficulty =
  | 'beginner'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'expert'
  | 'hell'

export type GameKind = 'normal' | 'daily'

export type Settings = {
  mode: Mode
  theme: Theme
  vibration: boolean
  sound: boolean
  realtimeErrors: boolean
  autoCandidates: boolean
  inputMode: InputMode
  keyboardSide: KeyboardSide
  cloudSync: boolean
}

export type GameId = {
  kind: GameKind
  difficulty: Difficulty
  seed: number
  date?: string
}

export type GameSnapshot = {
  version: 1
  id: GameId
  startedAt: number
  elapsedMs: number
  puzzle: string
  solution: string
  given: string
  entries: string
  notes: string
  noteMode: boolean
  selected: number
  selectedDigit: number
  undo: string[]
  redo: string[]
}

export type Stats = {
  version: 1
  totalTimeSec: number
  totalCompleted: number
  completedByDifficulty: Record<Difficulty, number>
  hintsUsed: number
  errors: number
  bestTimeSec: Partial<Record<Difficulty, number>>
  avgTimeSec: Partial<Record<Difficulty, number>>
  dailyStreak: number
  dailyBestStreak: number
  dailyLastDate: string | null
  noErrorCompletions: number
  noHintCompletions: number
  achievements: Record<string, boolean>
}

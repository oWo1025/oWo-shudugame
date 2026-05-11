import type { Difficulty, Stats } from './types'

export const applyAchievements = (s: Stats) => {
  const a = { ...s.achievements }

  a['intro10'] = (s.completedByDifficulty.beginner ?? 0) >= 10
  a['noMistakeHard'] = s.noErrorCompletions >= 1
  a['noHintExpert10'] = s.noHintCompletions >= 10
  a['daily30'] = s.dailyBestStreak >= 30
  a['hellMaster'] = (s.completedByDifficulty.hell ?? 0) >= 1

  s.achievements = a
}

export const difficultyLabel = (d: Difficulty) => {
  if (d === 'beginner') return '新手'
  if (d === 'easy') return '简单'
  if (d === 'medium') return '中等'
  if (d === 'hard') return '困难'
  if (d === 'expert') return '专家'
  return '地狱'
}


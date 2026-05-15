import type { Difficulty, Stats } from './types'

export const applyAchievements = (s: Stats) => {
  const a = { ...s.achievements }

  a['firstWin'] = s.totalCompleted >= 1
  a['intro10'] = (s.completedByDifficulty.beginner ?? 0) >= 10
  a['easyClear'] = (s.completedByDifficulty.easy ?? 0) >= 5
  a['total50'] = s.totalCompleted >= 50
  a['daily7'] = s.dailyBestStreak >= 7
  a['noMistakeHard'] = s.noErrorCompletions >= 1
  a['mediumMaster'] = (s.completedByDifficulty.medium ?? 0) >= 10
  a['hardConqueror'] = (s.completedByDifficulty.hard ?? 0) >= 5
  a['speedDemon'] = s.totalCompleted >= 1 &&
    Object.entries(s.bestTimeSec).some(([, time]) => time !== undefined && time <= 300)
  a['speedLightning'] = s.totalCompleted >= 1 &&
    Object.entries(s.bestTimeSec).some(([, time]) => time !== undefined && time <= 180)
  a['noHintMaster'] = s.noHintCompletions >= 20
  a['noHintExpert10'] = s.noHintCompletions >= 10
  a['daily30'] = s.dailyBestStreak >= 30
  a['persistence'] = s.totalCompleted >= 100
  a['marathon'] = s.totalTimeSec >= 36000
  a['expertClear'] = (s.completedByDifficulty.expert ?? 0) >= 10
  a['daily100'] = s.dailyBestStreak >= 100
  a['hellMaster'] = (s.completedByDifficulty.hell ?? 0) >= 1
  a['perfectionist'] = s.noErrorCompletions >= 1 &&
    s.noHintCompletions >= 1 &&
    ((s.completedByDifficulty.hard ?? 0) >= 1 ||
     (s.completedByDifficulty.expert ?? 0) >= 1 ||
     (s.completedByDifficulty.hell ?? 0) >= 1)
  a['allDiff'] = (s.completedByDifficulty.beginner ?? 0) >= 1 &&
    (s.completedByDifficulty.easy ?? 0) >= 1 &&
    (s.completedByDifficulty.medium ?? 0) >= 1 &&
    (s.completedByDifficulty.hard ?? 0) >= 1 &&
    (s.completedByDifficulty.expert ?? 0) >= 1 &&
    (s.completedByDifficulty.hell ?? 0) >= 1
  a['total500'] = s.totalCompleted >= 500

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


import type { Stats } from '../types'
import { difficultyLabel } from '../achievements'
import { Button, ProgressBar } from '../ui'
import { playSound } from '../sound'

const fmtTime = (sec: number) => {
  const s = Math.max(0, sec | 0)
  const m = (s / 60) | 0
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

const fmtTimeShort = (sec: number) => {
  if (!sec) return '-'
  const s = Math.max(0, sec | 0)
  const m = (s / 60) | 0
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

type AchievementKey = 'intro10' | 'noMistakeHard' | 'noHintExpert10' | 'daily30' | 'hellMaster' | 'speedDemon' | 'persistence' | 'perfectionist' | 'firstWin' | 'easyClear' | 'mediumMaster' | 'hardConqueror' | 'speedLightning' | 'marathon' | 'daily7' | 'daily100' | 'noHintMaster' | 'expertClear' | 'allDiff' | 'total50' | 'total500'

interface AchievementDef {
  key: AchievementKey
  name: string
  desc: string
  icon: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

const achievementDefs: AchievementDef[] = [
  { key: 'firstWin', name: '初次通关', desc: '完成第一局', icon: '🌱', tier: 'bronze' },
  { key: 'intro10', name: '入门玩家', desc: '完成10局新手难度', icon: '🎯', tier: 'bronze' },
  { key: 'easyClear', name: '简单起步', desc: '完成5局简单难度', icon: '🌈', tier: 'bronze' },
  { key: 'total50', name: '半百之路', desc: '累计完成50局', icon: '📈', tier: 'bronze' },
  { key: 'daily7', name: '每周打卡', desc: '连续7天每日挑战', icon: '📆', tier: 'bronze' },
  { key: 'noMistakeHard', name: '零失误大师', desc: '零失误完成任意一局', icon: '✨', tier: 'silver' },
  { key: 'mediumMaster', name: '中等高手', desc: '完成10局中等难度', icon: '🔥', tier: 'silver' },
  { key: 'hardConqueror', name: '困难征服者', desc: '完成5局困难难度', icon: '⚔️', tier: 'silver' },
  { key: 'speedDemon', name: '速度之星', desc: '任意难度5分钟内完成', icon: '⚡', tier: 'silver' },
  { key: 'speedLightning', name: '闪电手', desc: '3分钟内完成一局', icon: '⚡', tier: 'silver' },
  { key: 'noHintMaster', name: '独立思考', desc: '累计20局无提示完成', icon: '🤔', tier: 'silver' },
  { key: 'noHintExpert10', name: '无提示王者', desc: '10局无提示完成', icon: '🧠', tier: 'gold' },
  { key: 'daily30', name: '每日达人', desc: '连续打卡30天', icon: '📅', tier: 'gold' },
  { key: 'persistence', name: '坚持不懈', desc: '累计完成100局', icon: '💪', tier: 'gold' },
  { key: 'marathon', name: '马拉松', desc: '累计游戏时长超过10小时', icon: '🏃', tier: 'gold' },
  { key: 'expertClear', name: '专家之路', desc: '完成10局专家难度', icon: '🎓', tier: 'gold' },
  { key: 'daily100', name: '百日坚持', desc: '连续100天每日挑战', icon: '🌟', tier: 'gold' },
  { key: 'hellMaster', name: '数独宗师', desc: '完成地狱难度', icon: '👑', tier: 'platinum' },
  { key: 'perfectionist', name: '完美主义者', desc: '零失误零提示通关困难+', icon: '💎', tier: 'platinum' },
  { key: 'allDiff', name: '全能玩家', desc: '所有难度各完成至少1局', icon: '🏅', tier: 'platinum' },
  { key: 'total500', name: '传奇玩家', desc: '累计完成500局', icon: '👑', tier: 'platinum' },
]

export const StatsScreen = ({ value, onBack }: { value: Stats; onBack: () => void }) => {
  const total = Math.max(1, value.totalCompleted)
  const diffs = ['beginner', 'easy', 'medium', 'hard', 'expert', 'hell'] as const
  const btnClick = () => playSound(true, 'click')

  const checkSpeedDemon = value.totalCompleted >= 1 &&
    Object.entries(value.bestTimeSec).some(([, time]) => time !== undefined && time <= 300)

  const checkSpeedLightning = value.totalCompleted >= 1 &&
    Object.entries(value.bestTimeSec).some(([, time]) => time !== undefined && time <= 180)

  const checkPersistence = value.totalCompleted >= 100

  const checkPerfectionist = value.noErrorCompletions >= 1 &&
    value.noHintCompletions >= 1 &&
    ((value.completedByDifficulty.hard ?? 0) >= 1 ||
     (value.completedByDifficulty.expert ?? 0) >= 1 ||
     (value.completedByDifficulty.hell ?? 0) >= 1)

  const checkAllDiff = (value.completedByDifficulty.beginner ?? 0) >= 1 &&
    (value.completedByDifficulty.easy ?? 0) >= 1 &&
    (value.completedByDifficulty.medium ?? 0) >= 1 &&
    (value.completedByDifficulty.hard ?? 0) >= 1 &&
    (value.completedByDifficulty.expert ?? 0) >= 1 &&
    (value.completedByDifficulty.hell ?? 0) >= 1

  const achievementStates: Record<string, boolean> = {
    ...value.achievements,
    firstWin: value.totalCompleted >= 1,
    easyClear: (value.completedByDifficulty.easy ?? 0) >= 5,
    mediumMaster: (value.completedByDifficulty.medium ?? 0) >= 10,
    hardConqueror: (value.completedByDifficulty.hard ?? 0) >= 5,
    speedDemon: checkSpeedDemon,
    speedLightning: checkSpeedLightning,
    marathon: value.totalTimeSec >= 36000,
    daily7: value.dailyBestStreak >= 7,
    daily100: value.dailyBestStreak >= 100,
    noHintMaster: value.noHintCompletions >= 20,
    expertClear: (value.completedByDifficulty.expert ?? 0) >= 10,
    allDiff: checkAllDiff,
    total50: value.totalCompleted >= 50,
    total500: value.totalCompleted >= 500,
    persistence: checkPersistence,
    perfectionist: checkPerfectionist,
  }

  const achievements = achievementDefs.map((def) => ({
    ...def,
    done: !!achievementStates[def.key],
  }))

  const doneCount = achievements.filter((a) => a.done).length

  return (
    <div className="app">
      <div className="topbar">
        <Button onClick={() => { btnClick(); onBack() }}>返回</Button>
        <div className="title pageTitleGradient">统计</div>
        <div />
      </div>

      <div className="card">
        <div className="cardHeader">
          <span className="muted">全局数据</span>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="row">
            <span className="statRowIcon" style={{ background: 'linear-gradient(135deg, #00b894, #55efc4)' }}>⏱</span>
            <div className="muted">总时长</div>
            <div className="spacer" />
            <div className="statValue">{fmtTime(value.totalCompleted > 0 ? value.totalTimeSec : 0)}</div>
          </div>
          <div className="row">
            <span className="statRowIcon" style={{ background: 'linear-gradient(135deg, #f9ca24, #f0932b)' }}>🏆</span>
            <div className="muted">通关数</div>
            <div className="spacer" />
            <div className="statValue">{value.totalCompleted}</div>
          </div>
          <div className="row">
            <span className="statRowIcon" style={{ background: 'linear-gradient(135deg, #fd9644, #fed330)' }}>💡</span>
            <div className="muted">提示次数</div>
            <div className="spacer" />
            <div className="statValue">{value.hintsUsed}</div>
          </div>
          <div className="row">
            <span className="statRowIcon" style={{ background: 'linear-gradient(135deg, #e25555, #ff7675)' }}>✕</span>
            <div className="muted">错误次数</div>
            <div className="spacer" />
            <div className="statValue">{value.errors}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <span className="muted">难度分布</span>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          {diffs.map((d) => {
            const n = value.completedByDifficulty[d] ?? 0
            const best = value.bestTimeSec[d]
            const avg = value.avgTimeSec[d]
            return (
              <div key={d} style={{ display: 'grid', gap: 6 }}>
                <div className="row">
                  <div style={{ fontWeight: 500 }}>{difficultyLabel(d)}</div>
                  <div className="spacer" />
                  <div className="muted" style={{ fontSize: 13 }}>
                    {n} 局
                  </div>
                </div>
                <ProgressBar value={n / total} />
                <div className="row" style={{ fontSize: 12 }}>
                  <span className="muted">最佳 {fmtTimeShort(best ?? 0)}</span>
                  <span className="muted">均时 {fmtTimeShort(avg ?? 0)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <span className="muted">每日挑战</span>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="row">
            <div className="muted">连续打卡</div>
            <div className="spacer" />
            <div className="statValue">{value.dailyStreak} 天</div>
          </div>
          <div className="row">
            <div className="muted">历史最高</div>
            <div className="spacer" />
            <div className="statValue">{value.dailyBestStreak} 天</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <span className="muted">成就</span>
          <span className="achievementProgress">
            {doneCount}/{achievements.length}
          </span>
        </div>
        <div className="achievementGrid">
          {achievements.map((a) => (
            <div
              key={a.key}
              className={`achievementCard ${a.done ? `achievement${a.tier.charAt(0).toUpperCase() + a.tier.slice(1)}Done` : ''}`}
              title={a.desc}
            >
              <div className="achievementIcon">{a.icon}</div>
              <div className="achievementName">{a.name}</div>
              <div className="achievementDesc">{a.desc}</div>
              {a.done && <div className="achievementCheck">✓</div>}
            </div>
          ))}
        </div>
        <div className="achievementLegend">
          <span className="legendItem legendBronze"><span className="legendDot"></span>铜</span>
          <span className="legendItem legendSilver"><span className="legendDot"></span>银</span>
          <span className="legendItem legendGold"><span className="legendDot"></span>金</span>
          <span className="legendItem legendPlatinum"><span className="legendDot"></span>钻</span>
        </div>
      </div>
    </div>
  )
}

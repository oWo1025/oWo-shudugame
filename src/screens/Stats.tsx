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

export const StatsScreen = ({ value, onBack }: { value: Stats; onBack: () => void }) => {
  const total = Math.max(1, value.totalCompleted)
  const diffs = ['beginner', 'easy', 'medium', 'hard', 'expert', 'hell'] as const
  const btnClick = () => playSound(true, 'click')

  const achievements: Array<{ key: string; name: string; desc: string; done: boolean }> = [
    { key: 'intro10', name: '入门玩家', desc: '完成10局新手难度', done: !!value.achievements['intro10'] },
    { key: 'noMistakeHard', name: '零失误大师', desc: '零失误完成任意一局', done: !!value.achievements['noMistakeHard'] },
    { key: 'noHintExpert10', name: '无提示王者', desc: '10局无提示完成', done: !!value.achievements['noHintExpert10'] },
    { key: 'daily30', name: '每日达人', desc: '连续打卡30天', done: !!value.achievements['daily30'] },
    { key: 'hellMaster', name: '数独宗师', desc: '完成地狱难度', done: !!value.achievements['hellMaster'] },
  ]

  const doneCount = achievements.filter((a) => a.done).length

  return (
    <div className="app">
      <div className="topbar">
        <Button onClick={() => { btnClick(); onBack() }}>返回</Button>
        <div className="title">统计</div>
        <div />
      </div>

      <div className="card">
        <div className="cardHeader">
          <span className="muted">全局数据</span>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="row">
            <div className="muted">总时长</div>
            <div className="spacer" />
            <div className="statValue">{fmtTime(value.totalTimeSec)}</div>
          </div>
          <div className="row">
            <div className="muted">通关数</div>
            <div className="spacer" />
            <div className="statValue">{value.totalCompleted}</div>
          </div>
          <div className="row">
            <div className="muted">提示次数</div>
            <div className="spacer" />
            <div className="statValue">{value.hintsUsed}</div>
          </div>
          <div className="row">
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
          <span className="statValue" style={{ fontSize: 14, color: 'var(--accent)' }}>
            {doneCount}/{achievements.length}
          </span>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {achievements.map((a) => (
            <div
              key={a.key}
              className="row"
              style={{
                padding: '8px 0',
                opacity: a.done ? 1 : 0.45,
                transition: 'opacity 300ms ease',
              }}
            >
              <div style={{ fontWeight: 500 }}>{a.name}</div>
              <div className="spacer" />
              <div className="muted" style={{ fontSize: 12 }}>
                {a.done ? '已解锁' : a.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

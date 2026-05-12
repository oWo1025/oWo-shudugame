import { useState, useCallback } from 'react'
import type { Difficulty } from '../types'
import { Button } from '../ui'
import { APP_VERSION } from '../version'
import { playSound } from '../sound'

const diffBadgeClass = (d: Difficulty) => {
  const map: Record<Difficulty, string> = {
    beginner: 'diffBadge diffBadgeBeginner',
    easy: 'diffBadge diffBadgeEasy',
    medium: 'diffBadge diffBadgeMedium',
    hard: 'diffBadge diffBadgeHard',
    expert: 'diffBadge diffBadgeExpert',
    hell: 'diffBadge diffBadgeHell',
  }
  return map[d]
}

const diffStars = (d: Difficulty) => {
  const map: Record<Difficulty, number> = {
    beginner: 1,
    easy: 2,
    medium: 3,
    hard: 4,
    expert: 5,
    hell: 6,
  }
  return map[d]
}

const homeLogoDigits = [5, 3, 7, 6, 1, 9, 2, 4, 8]

export const Home = ({
  canContinue,
  onContinue,
  onNewGame,
  onDaily,
  onStats,
  onSettings,
  soundOn,
}: {
  canContinue: boolean
  onContinue: () => void
  onNewGame: (d: Difficulty) => void
  onDaily: (d: Difficulty) => void
  onStats: () => void
  onSettings: () => void
  soundOn: boolean
}) => {
  const [logoClicked, setLogoClicked] = useState(false)

  const onHover = useCallback(() => playSound(soundOn, 'hover'), [soundOn])
  const onClick = useCallback(() => playSound(soundOn, 'click'), [soundOn])

  const onLogoClick = () => {
    playSound(soundOn, 'click')
    setLogoClicked(true)
    window.setTimeout(() => setLogoClicked(false), 600)
  }

  const diffs: Array<{ d: Difficulty; label: string }> = [
    { d: 'beginner', label: '新手' },
    { d: 'easy', label: '简单' },
    { d: 'medium', label: '中等' },
    { d: 'hard', label: '困难' },
    { d: 'expert', label: '专家' },
    { d: 'hell', label: '地狱' },
  ]

  return (
    <div className="app" role="application">
      <div className="homeLogo" style={{ cursor: 'pointer' }} onClick={onLogoClick}>
        <div className={`homeLogoGrid${logoClicked ? ' homeLogoGridClicked' : ''}`}>
          {homeLogoDigits.map((d, i) => (
            <div key={i} className="homeLogoCell">{d}</div>
          ))}
        </div>
      </div>
      <div className="homeTitle">数独</div>
      <div className="homeSubtitle">随时随地，挑战你的逻辑思维</div>

      <div className="btnRow">
        <Button wide disabled={!canContinue} onClick={onContinue} onHover={onHover} onClickSound={onClick}>
          继续游戏
        </Button>

        <div className="card">
          <div className="cardHeader">
            <span className="muted">新游戏</span>
          </div>
          <div className="btnRow">
            {diffs.map((x) => (
              <button key={x.d} type="button" className="diffBtn" onClick={() => { onClick(); onNewGame(x.d) }} onMouseEnter={onHover}>
                <span>{x.label}</span>
                <span className={diffBadgeClass(x.d)}>
                  {'★'.repeat(diffStars(x.d))}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <span className="muted">每日挑战</span>
          </div>
          <div className="btnRow">
            {diffs.map((x) => (
              <button key={x.d} type="button" className="diffBtn" onClick={() => { onClick(); onDaily(x.d) }} onMouseEnter={onHover}>
                <span>{x.label}</span>
                <span className={diffBadgeClass(x.d)}>
                  {'★'.repeat(diffStars(x.d))}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Button wide onClick={onStats} onHover={onHover} onClickSound={onClick}>
          统计数据
        </Button>
        <Button wide onClick={onSettings} onHover={onHover} onClickSound={onClick}>
          设置
        </Button>
      </div>

      <div className="homeFooter">
        <span className="homeFooterVersion">v{APP_VERSION}</span>
        <span className="homeFooterAuthor">⭐Created by 👉oWo❤️DouDou👈</span>
      </div>
    </div>
  )
}

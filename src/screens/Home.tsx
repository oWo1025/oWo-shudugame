import { useState, useCallback, useEffect } from 'react'
import type { Difficulty } from '../types'
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

const menuItems = [
  { id: 'stats', icon: '📊', label: '统计', color: '#6c5ce7', gradient: 'linear-gradient(135deg, #00b894, #55efc4)', symbol: '▤' },
  { id: 'settings', icon: '⚙️', label: '设置', color: '#00b894', gradient: 'linear-gradient(135deg, #636e72, #b2bec3)', symbol: '⚙' },
]

export const Home = ({
  canContinue,
  onContinue,
  onNewGame,
  onDaily,
  onStats,
  onSettings,
  soundOn,
  animateIn = true,
}: {
  canContinue: boolean
  onContinue: () => void
  onNewGame: (d: Difficulty) => void
  onDaily: (d: Difficulty) => void
  onStats: () => void
  onSettings: () => void
  soundOn: boolean
  animateIn?: boolean
}) => {
  const [logoClicked, setLogoClicked] = useState(false)
  const [shouldAnimate, setShouldAnimate] = useState(animateIn)
  const [showDiffPicker, setShowDiffPicker] = useState<'newGame' | 'daily' | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<'newGame' | 'daily' | null>(null)

  useEffect(() => {
    setShouldAnimate(animateIn)
  }, [animateIn])

  const onHover = useCallback(() => playSound(soundOn, 'hover'), [soundOn])
  const onClick = useCallback(() => playSound(soundOn, 'click'), [soundOn])

  const onLogoClick = () => {
    playSound(soundOn, 'click')
    setLogoClicked(true)
    window.setTimeout(() => setLogoClicked(false), 600)
  }

  const handleCategoryClick = (category: 'newGame' | 'daily') => {
    onClick()
    if (showDiffPicker === category) {
      setShowDiffPicker(null)
      setSelectedCategory(null)
    } else {
      setShowDiffPicker(category)
      setSelectedCategory(category)
    }
  }

  const handleDiffSelect = (d: Difficulty) => {
    onClick()
    setShowDiffPicker(null)
    setSelectedCategory(null)
    if (selectedCategory === 'newGame') {
      onNewGame(d)
    } else {
      onDaily(d)
    }
  }

  const handleBackdropClick = () => {
    setShowDiffPicker(null)
    setSelectedCategory(null)
  }

  const diffs: Array<{ d: Difficulty; label: string }> = [
    { d: 'beginner', label: '新手😁' },
    { d: 'easy', label: '简单🙂' },
    { d: 'medium', label: '中等🤔' },
    { d: 'hard', label: '困难😢' },
    { d: 'expert', label: '专家🙃' },
    { d: 'hell', label: '地狱🤪' },
  ]

  return (
    <div className={`app ${shouldAnimate ? 'screenEnter' : ''}`} role="application">
      <div className="homeLogo" style={{ cursor: 'pointer' }} onClick={onLogoClick}>
        <div className={`homeLogoGrid${logoClicked ? ' homeLogoGridClicked' : ''}`}>
          {homeLogoDigits.map((d, i) => (
            <div key={i} className="homeLogoCell">{d}</div>
          ))}
        </div>
      </div>
      <div className="homeTitle">数独</div>
      <div className="homeSubtitle">随时随地，挑战你的逻辑思维</div>

      {canContinue && (
        <button
          className="menuCard menuCardPrimary"
          onClick={() => { onClick(); onContinue() }}
          onMouseEnter={onHover}
        >
          <span className="menuCardIconWrap" style={{ background: 'linear-gradient(135deg, #20c997, #38d9a9)' }}><span className="menuCardIconInner">▶</span></span>
          <span className="menuCardLabel">继续游戏</span>
          <span className="menuCardArrow">→</span>
        </button>
      )}

      <div className="menuGrid">
        <button
          className={`menuCard ${selectedCategory === 'newGame' ? 'menuCardActive' : ''}`}
          onClick={() => handleCategoryClick('newGame')}
          onMouseEnter={onHover}
        >
          <span className="menuCardIconWrap" style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}><span className="menuCardIconInner">🎮</span></span>
          <span className="menuCardLabel">新游戏</span>
        </button>
        <button
          className={`menuCard ${selectedCategory === 'daily' ? 'menuCardActive' : ''}`}
          onClick={() => handleCategoryClick('daily')}
          onMouseEnter={onHover}
        >
          <span className="menuCardIconWrap" style={{ background: 'linear-gradient(135deg, #fd9644, #fed330)' }}><span className="menuCardIconInner">📅</span></span>
          <span className="menuCardLabel">每日挑战</span>
        </button>
      </div>

      {menuItems.map((item) => (
        <button
          key={item.id}
          className="menuCard"
          onClick={() => {
            onClick()
            if (item.id === 'stats') onStats()
            if (item.id === 'settings') onSettings()
          }}
          onMouseEnter={onHover}
        >
          <span className="menuCardIconWrap" style={{ background: item.gradient }}><span className="menuCardIconInner">{item.symbol}</span></span>
          <span className="menuCardLabel">{item.label}</span>
          <span className="menuCardArrow">→</span>
        </button>
      ))}

      {showDiffPicker && (
        <div className="diffPickerOverlay" onClick={handleBackdropClick}>
          <div className="diffPicker" onClick={(e) => e.stopPropagation()}>
            <div className="diffPickerHeader">
              <span>{showDiffPicker === 'newGame' ? '🎮 选择难度' : '📅 每日挑战'}</span>
            </div>
            <div className="diffPickerGrid">
              {diffs.map((x) => (
                <button
                  key={x.d}
                  type="button"
                  className="diffPickerBtn"
                  onClick={() => handleDiffSelect(x.d)}
                  onMouseEnter={onHover}
                >
                  <span className="diffPickerLabel">{x.label}</span>
                  <span className={diffBadgeClass(x.d)}>
                    {'★'.repeat(diffStars(x.d))}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="homeFooter">
        <span className="homeFooterVersion">v{APP_VERSION}</span>
        <span className="homeFooterAuthor">⭐Created by 👉oWo❤️DouDou👈</span>
      </div>
    </div>
  )
}

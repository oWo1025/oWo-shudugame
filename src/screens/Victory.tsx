import { useMemo, useState } from 'react'
import type { Difficulty } from '../types'
import { difficultyLabel } from '../achievements'
import { rowOf, colOf } from '../sudoku/grid'

const fmtTime = (ms: number) => {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const m = (sec / 60) | 0
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const COLORS = ['#6c5ce7', '#a29bfe', '#20c997', '#fdcb6e', '#e17055', '#fd79a8']

interface ConfettiPiece {
  left: string
  animationDelay: string
  animationDuration: string
  backgroundColor: string
}

const generateConfetti = (count: number): ConfettiPiece[] => {
  return Array.from({ length: count }, () => ({
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 2}s`,
    animationDuration: `${2 + Math.random() * 2}s`,
    backgroundColor: COLORS[Math.floor(Math.random() * COLORS.length)],
  }))
}

interface MiniBoardProps {
  entries: Uint8Array
  given: Uint8Array
}

const MiniBoard = ({ entries, given }: MiniBoardProps) => {
  return (
    <div className="victoryMiniBoard">
      <div className="victoryMiniGrid">
        {Array.from({ length: 81 }, (_, pos) => {
          const r = rowOf(pos)
          const c = colOf(pos)
          const value = entries[pos]
          const isGiven = given[pos] === 1
          const bx = c === 2 || c === 5
          const by = r === 2 || r === 5

          return (
            <div
              key={pos}
              className={`victoryMiniCell${bx ? ' victoryMiniBorderX' : ''}${by ? ' victoryMiniBorderY' : ''}`}
            >
              <span className={`victoryMiniValue${isGiven ? ' victoryMiniValueGiven' : ''}`}>
                {value || ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const VictoryScreen = ({
  difficulty,
  elapsedMs,
  wrongCount,
  hintCount,
  entries,
  given,
  onReplay,
  onHome,
}: {
  difficulty: Difficulty
  elapsedMs: number
  wrongCount: number
  hintCount: number
  entries?: Uint8Array
  given?: Uint8Array
  onReplay: () => void
  onHome: () => void
}) => {
  const confettiPieces = useMemo(() => generateConfetti(50), [])
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const text = `🏆 数独完成！难度：${difficultyLabel(difficulty)} | 用时：${fmtTime(elapsedMs)} | 错误：${wrongCount} | 提示：${hintCount} www.example.com`
    if (navigator.share) {
      try {
        await navigator.share({ title: '数独完成', text, url: 'https://www.example.com' })
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      } catch {}
    }
  }

  return (
    <div className="victoryContainer">
      <div className="confetti">
        {confettiPieces.map((piece, i) => (
          <div
            key={i}
            className="confettiPiece"
            style={piece}
          />
        ))}
      </div>

      <div className="victoryContent">
        <div className="victoryIcon">
          <span className="victoryTrophy">🏆</span>
          <div className="victorySparkles">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="sparkle"
                style={{
                  transform: `rotate(${i * 45}deg) translateY(-60px)`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>

        <h1 className="victoryTitle">恭喜完成!</h1>
        <p className="victorySubtitle">你成功破解了谜题</p>
        <p className="victoryUrl">www.example.com</p>

        <div className="victoryStats">
          <div className="victoryStat">
            <span className="victoryStatLabel">难度</span>
            <span className="victoryStatValue">{difficultyLabel(difficulty)}</span>
          </div>
          <div className="victoryStat">
            <span className="victoryStatLabel">用时</span>
            <span className="victoryStatValue">{fmtTime(elapsedMs)}</span>
          </div>
          <div className="victoryStat">
            <span className="victoryStatLabel">错误</span>
            <span className="victoryStatValue">{wrongCount}</span>
          </div>
          <div className="victoryStat">
            <span className="victoryStatLabel">提示</span>
            <span className="victoryStatValue">{hintCount}</span>
          </div>
        </div>

        {wrongCount === 0 && hintCount === 0 && (
          <div className="victoryPerfect">
            <span className="perfectBadge">✨ 完美通关 ✨</span>
          </div>
        )}

        {entries && given && (
          <div className="victoryBoardSection">
            <div className="victoryBoardLabel">
              <span className="victoryBoardIcon">🎯</span>
              本局完成棋盘
            </div>
            <MiniBoard entries={entries} given={given} />
          </div>
        )}

        <div className="victoryShare">
          <button type="button" className="btn btnWide" onClick={handleShare}>
            📤 {copied ? '已复制' : '分享成绩'}
          </button>
        </div>

        <div className="victoryActions">
          <button type="button" className="btn btnWide btnPrimary" onClick={onReplay}>
            再来一局
          </button>
          <button type="button" className="btn btnWide" onClick={onHome}>
            返回主页
          </button>
        </div>
      </div>
    </div>
  )
}

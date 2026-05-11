import { useMemo, useRef, type TouchEvent } from 'react'
import type { Settings } from '../types'
import type { GameRuntime } from '../game/game'
import { candidatesMask, maskToDigits, rowOf, colOf, boxOf } from '../sudoku/grid'
import { difficultyLabel } from '../achievements'
import { IconEraser, IconHint, IconPencil, IconUndo } from '../icons'

const fmtTime = (ms: number) => {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const m = (sec / 60) | 0
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export const GameScreen = ({
  game,
  settings,
  paused,
  highlight,
  globalWrong,
  onLongPressCell,
  onCleanNotes,
  onCheckErrors,
  onPause,
  onSelect,
  onInputDigit,
  onErase,
  onToggleNote,
  onUndo,
  onRedo,
  onHint,
}: {
  game: GameRuntime
  settings: Settings
  paused: boolean
  highlight: Uint8Array | null
  globalWrong: Uint8Array | null
  onLongPressCell: (pos: number) => void
  onCleanNotes: () => void
  onCheckErrors: () => void
  onPause: () => void
  onSelect: (pos: number) => void
  onInputDigit: (digit: number) => void
  onErase: () => void
  onToggleNote: () => void
  onUndo: () => void
  onRedo: () => void
  onHint: () => void
}) => {
  const rel = useMemo(() => {
    if (game.selected < 0) return null
    return { r: rowOf(game.selected), c: colOf(game.selected), b: boxOf(game.selected) }
  }, [game.selected])

  const activeDigit = settings.inputMode === 'numberFirst' ? game.selectedDigit : 0

  const pressTimer = useRef<number | null>(null)
  const pressPos = useRef<number>(-1)
  const longPressFired = useRef(false)

  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const onPointerDown = (pos: number) => {
    pressPos.current = pos
    longPressFired.current = false
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null
      longPressFired.current = true
      onLongPressCell(pos)
    }, 420)
  }

  const clearPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current)
    pressTimer.current = null
    pressPos.current = -1
  }

  const noteTimer = useRef<number | null>(null)
  const hintTimer = useRef<number | null>(null)
  const noteLongPress = useRef(false)
  const hintLongPress = useRef(false)

  const clearTimers = () => {
    if (noteTimer.current) window.clearTimeout(noteTimer.current)
    if (hintTimer.current) window.clearTimeout(hintTimer.current)
    noteTimer.current = null
    hintTimer.current = null
  }

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }

  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dy) > 30) return
    if (dx < -60) onUndo()
    if (dx > 60) onRedo()
  }

  const padAlign = settings.keyboardSide === 'left' ? 'flex-start' : 'flex-end'

  return (
    <div className="app">
      <div className="topbar">
        <div className="muted">{difficultyLabel(game.id.difficulty)}</div>
        <div className="title" style={{ fontVariantNumeric: 'tabular-nums' as any }}>
          {fmtTime(game.elapsedMs)}
        </div>
        <div style={{ textAlign: 'right' }}>
          <button type="button" className="btn pauseBtn" onClick={onPause}>
            暂停
          </button>
        </div>
      </div>

      <div className="gridWrap" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="board" role="grid" aria-label="数独棋盘">
          {Array.from({ length: 81 }, (_, pos) => {
            const r = rowOf(pos)
            const c = colOf(pos)
            const selected = pos === game.selected
            const related = !!rel && (r === rel.r || c === rel.c || boxOf(pos) === rel.b)
            const hint = highlight ? highlight[pos] === 1 : false
            const wrongRealtime =
              settings.realtimeErrors && !paused && !game.given[pos] && game.entries[pos] !== 0
                ? game.entries[pos] !== game.solution[pos]
                : false
            const wrongGlobal = globalWrong ? globalWrong[pos] === 1 : false
            const wrong = wrongRealtime || wrongGlobal

            const aria = (() => {
              const rr = r + 1
              const cc = c + 1
              const v = paused ? 0 : game.entries[pos]
              const txt = v === 0 ? '空' : String(v)
              const fixed = game.given[pos] ? '固定' : '可填'
              return `第${rr}行第${cc}列，${txt}，${fixed}`
            })()

            const showValue = !paused && game.entries[pos] !== 0
            const showNotes = !paused && game.entries[pos] === 0

            const notesMask = game.notes[pos]
            const showManualNotes = showNotes && notesMask !== 0
            const autoMask =
              showNotes && !showManualNotes && settings.autoCandidates ? candidatesMask(game.entries, pos) : 0
            const digits = showManualNotes ? maskToDigits(notesMask) : maskToDigits(autoMask)

            return (
              <button
                key={pos}
                type="button"
                className={`cell${hint ? ' cellHintPulse' : ''}${wrongGlobal ? ' cellCheckFlash' : ''}`}
                data-by={r}
                data-bx={c}
                data-selected={selected ? 'true' : 'false'}
                data-rel={(related || hint) && !selected ? 'true' : 'false'}
                data-wrong={wrong ? 'true' : 'false'}
                onClick={() => {
                  if (longPressFired.current) return
                  onSelect(pos)
                }}
                onDoubleClick={() => onToggleNote()}
                onPointerDown={() => onPointerDown(pos)}
                onPointerUp={() => clearPress()}
                onPointerCancel={() => clearPress()}
                onPointerLeave={() => {
                  if (pressPos.current === pos) clearPress()
                }}
                role="gridcell"
                aria-label={aria}
              >
                <span className="cellInner">
                  {showValue ? (
                    <span className="value" data-given={game.given[pos] ? 'true' : 'false'} data-wrong={wrong ? 'true' : 'false'}>
                      {game.entries[pos]}
                    </span>
                  ) : null}
                  {showNotes ? (
                    <span className="notes" aria-hidden="true">
                      {Array.from({ length: 9 }, (_, i) => {
                        const d = i + 1
                        return <span key={d}>{digits.includes(d) ? d : ''}</span>
                      })}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>

        <div className="padWrap" style={{ display: 'flex', alignItems: padAlign }}>
          <div style={{ width: '100%', maxWidth: 520 }}>
            <div className="pad" aria-label="数字键盘">
              {Array.from({ length: 9 }, (_, i) => {
                const d = i + 1
                const active = activeDigit === d
                return (
                  <button
                    key={d}
                    type="button"
                    className="padBtn"
                    data-active={active ? 'true' : 'false'}
                    onClick={() => onInputDigit(d)}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
            <div className="gameActions" style={{ marginTop: 8 }}>
              <button
                type="button"
                className={`btn${game.noteMode ? ' actionActive' : ''}`}
                onClick={() => {
                  if (noteLongPress.current) return
                  onToggleNote()
                }}
                onPointerDown={() => {
                  clearTimers()
                  noteLongPress.current = false
                  noteTimer.current = window.setTimeout(() => {
                    noteTimer.current = null
                    noteLongPress.current = true
                    onCleanNotes()
                  }, 420)
                }}
                onPointerUp={() => clearTimers()}
                onPointerCancel={() => clearTimers()}
                onPointerLeave={() => clearTimers()}
              >
                <IconPencil />
                {game.noteMode ? '笔记✓' : '笔记'}
              </button>
              <button type="button" className="btn" onClick={onErase}>
                <IconEraser />
                擦除
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  if (hintLongPress.current) return
                  onHint()
                }}
                onPointerDown={() => {
                  clearTimers()
                  hintLongPress.current = false
                  hintTimer.current = window.setTimeout(() => {
                    hintTimer.current = null
                    hintLongPress.current = true
                    onCheckErrors()
                  }, 420)
                }}
                onPointerUp={() => clearTimers()}
                onPointerCancel={() => clearTimers()}
                onPointerLeave={() => clearTimers()}
              >
                <IconHint />
                提示
              </button>
              <button type="button" className="btn" onClick={onUndo}>
                <IconUndo />
                撤销
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import type { Difficulty, Settings, Stats } from './types'
import { applyAchievements } from './achievements'
import { defaultSettings, defaultStats } from './defaults'
import { clearAll, clearGame, loadGame, loadSettings, loadStats, saveGame, saveSettings, saveStats } from './storage'
import { applyTheme, onSystemThemeChange, resolveMode } from './theme'
import { createPuzzle, makeGameId } from './puzzles/puzzles'
import { createNewGame, fromSnapshot, incrementHint, inputDigit, isComplete, toSnapshot, undo, redo, toggleNoteMode, clearCell, wrongMask, type GameRuntime } from './game/game'
import { findHiddenSingleHint, findNakedSingles } from './sudoku/hints'
import { candidatesMask } from './sudoku/grid'
import { Home } from './screens/Home'
import { SettingsScreen } from './screens/Settings'
import { StatsScreen } from './screens/Stats'
import { GameScreen } from './screens/Game'
import { Button, Modal, useToast } from './ui'
import { playSound } from './sound'

type Screen = 'home' | 'game' | 'stats' | 'settings'
type SettingsBack = 'home' | 'game' | 'pause'

const today = () => new Date().toISOString().slice(0, 10)

const vibrate = (on: boolean) => {
  if (!on) return
  if (!('vibrate' in navigator)) return
  ;(navigator as any).vibrate?.(10)
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings() ?? defaultSettings())
  const [stats, setStats] = useState<Stats>(() => loadStats() ?? defaultStats())
  const [screen, setScreen] = useState<Screen>('home')
  const [settingsBack, setSettingsBack] = useState<SettingsBack>('home')
  const [game, setGame] = useState<GameRuntime | null>(() => {
    const snap = loadGame()
    return snap ? fromSnapshot(snap) : null
  })

  const [paused, setPaused] = useState(false)
  const [pauseOpen, setPauseOpen] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [hintMaskState, setHintMaskState] = useState<Uint8Array | null>(null)
  const [checkMaskState, setCheckMaskState] = useState<Uint8Array | null>(null)

  const { toast, showToast } = useToast()

  useEffect(() => {
    applyTheme(settings.mode, settings.theme)
    if (settings.mode === 'system') return onSystemThemeChange(() => applyTheme(settings.mode, settings.theme))
    return () => {}
  }, [settings.mode, settings.theme])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    applyAchievements(stats)
    saveStats(stats)
  }, [stats])

  useEffect(() => {
    if (!game) return
    saveGame(toSnapshot(game))
  }, [game])

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        setPaused(true)
        setPauseOpen(true)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    if (!game) return
    if (screen !== 'game') return
    if (paused) return
    const start = Date.now()
    const base = game.elapsedMs
    const t = window.setInterval(() => {
      setGame((g) => (g ? { ...g, elapsedMs: base + (Date.now() - start) } : g))
    }, 250)
    return () => window.clearInterval(t)
  }, [game?.id.seed, screen, paused])

  const canContinue = !!game

  const startGame = (difficulty: Difficulty, kind: 'normal' | 'daily') => {
    const id = makeGameId(kind, difficulty, kind === 'daily' ? today() : undefined)
    const { puzzle, solution } = createPuzzle(id)
    const g = createNewGame(id, puzzle, solution)
    setGame(g)
    setPaused(false)
    setPauseOpen(false)
    setScreen('game')
  }

  const onContinue = () => {
    if (!game) return
    setPaused(false)
    setPauseOpen(false)
    setScreen('game')
  }

  const updateGame = (fn: (g: GameRuntime) => void) => {
    setGame((prev) => {
      if (!prev) return prev
      const next: GameRuntime = {
        ...prev,
        puzzle: new Uint8Array(prev.puzzle),
        solution: new Uint8Array(prev.solution),
        given: new Uint8Array(prev.given),
        entries: new Uint8Array(prev.entries),
        notes: new Uint16Array(prev.notes),
        undo: [...prev.undo],
        redo: [...prev.redo],
      }
      fn(next)
      return next
    })
  }

  const onSelect = (pos: number) => {
    updateGame((g) => {
      g.selected = pos
      if (settings.inputMode === 'numberFirst' && g.selectedDigit) {
        const wasNote = g.noteMode
        const d = g.selectedDigit
        const ok = inputDigit(g, pos, d)
        if (ok) {
          if (!wasNote && d !== g.solution[pos]) {
            setStats((s) => ({ ...s, errors: s.errors + 1 }))
            playSound(settings.sound, 'error')
          } else {
            playSound(settings.sound, wasNote ? 'note' : 'place')
          }
        }
        vibrate(settings.vibration)
      }
    })
  }

  const onInputDigit = (digit: number) => {
    if (!game) return
    if (settings.inputMode === 'numberFirst') {
      updateGame((g) => {
        g.selectedDigit = g.selectedDigit === digit ? 0 : digit
      })
      playSound(settings.sound, 'toggle')
      return
    }
    if (game.selected < 0) {
      showToast('请选择格子')
      return
    }
    updateGame((g) => {
      const wasNote = g.noteMode
      const ok = inputDigit(g, g.selected, digit)
      if (ok) {
        if (!wasNote && digit !== g.solution[g.selected]) {
          setStats((s) => ({ ...s, errors: s.errors + 1 }))
          playSound(settings.sound, 'error')
        } else {
          playSound(settings.sound, wasNote ? 'note' : 'place')
        }
        vibrate(settings.vibration)
      }
    })
  }

  const onErase = () => {
    if (!game) return
    if (game.selected < 0) {
      showToast('请选择格子')
      return
    }
    updateGame((g) => {
      if (clearCell(g, g.selected)) {
        vibrate(settings.vibration)
        playSound(settings.sound, 'erase')
      }
    })
  }

  const onToggleNote = () => {
    if (!game) return
    updateGame((g) => toggleNoteMode(g))
    vibrate(settings.vibration)
    playSound(settings.sound, 'toggle')
  }

  const onUndo = () => {
    if (!game) return
    updateGame((g) => undo(g))
    vibrate(settings.vibration)
    playSound(settings.sound, 'undo')
  }

  const onRedo = () => {
    if (!game) return
    updateGame((g) => redo(g))
    vibrate(settings.vibration)
    playSound(settings.sound, 'undo')
  }

  const onHint = () => {
    if (!game) return
    setHintOpen(true)
  }

  const applyHintMask = (idxs: number[]) => {
    const m = new Uint8Array(81)
    for (const i of idxs) m[i] = 1
    setHintMaskState(m)
    window.setTimeout(() => setHintMaskState(null), 1200)
  }

  const applyCheckMask = (m: Uint8Array) => {
    setCheckMaskState(m)
    window.setTimeout(() => setCheckMaskState(null), 1200)
  }

  const doHint1 = () => {
    if (!game) return
    const singles = findNakedSingles(game.entries)
    if (singles.length === 0) {
      showToast('暂无可直接填入的格子')
      return
    }
    applyHintMask(singles)
    updateGame((g) => incrementHint(g))
    setStats((s) => ({ ...s, hintsUsed: s.hintsUsed + 1 }))
    playSound(settings.sound, 'hint')
  }

  const doHint2 = () => {
    if (!game) return
    const h = findHiddenSingleHint(game.entries)
    if (!h) {
      showToast('当前无可用技巧提示')
      return
    }
    applyHintMask(h.highlight)
    showToast(h.message)
    updateGame((g) => incrementHint(g))
    setStats((s) => ({ ...s, hintsUsed: s.hintsUsed + 1 }))
    playSound(settings.sound, 'hint')
  }

  const doHint3 = () => {
    if (!game) return
    if (game.selected < 0) {
      showToast('请选择格子')
      return
    }
    if (game.given[game.selected]) {
      showToast('该格不可修改')
      return
    }
    const d = game.solution[game.selected]
    updateGame((g) => {
      inputDigit(g, g.selected, d)
      incrementHint(g)
    })
    vibrate(settings.vibration)
    playSound(settings.sound, 'hint')
    setStats((s) => ({ ...s, hintsUsed: s.hintsUsed + 1 }))
  }

  const doCheck = () => {
    if (!game) return
    const m = wrongMask(game)
    let has = false
    for (let i = 0; i < 81; i++) if (m[i]) has = true
    if (!has) {
      showToast('未发现错误')
      playSound(settings.sound, 'check')
    } else {
      playSound(settings.sound, 'error')
    }
    applyCheckMask(m)
  }

  const onLongPressCell = (pos: number) => {
    if (!game) return
    updateGame((g) => {
      g.selected = pos
      clearCell(g, pos)
    })
    vibrate(settings.vibration)
    playSound(settings.sound, 'erase')
  }

  const onCleanNotes = () => {
    if (!game) return
    updateGame((g) => {
      for (let i = 0; i < 81; i++) {
        if (g.entries[i] !== 0) continue
        if (g.notes[i] === 0) continue
        g.notes[i] = g.notes[i] & candidatesMask(g.entries, i)
      }
    })
    showToast('已清理')
    vibrate(settings.vibration)
    playSound(settings.sound, 'note')
  }

  const onComplete = () => {
    if (!game) return
    const seconds = Math.floor(game.elapsedMs / 1000)
    setStats((prev) => {
      const next = { ...prev }
      next.totalTimeSec += seconds
      next.totalCompleted += 1
      next.completedByDifficulty = { ...next.completedByDifficulty }
      next.completedByDifficulty[game.id.difficulty] = (next.completedByDifficulty[game.id.difficulty] ?? 0) + 1
      if (game.wrongCount === 0) next.noErrorCompletions += 1
      if (game.hintCount === 0) next.noHintCompletions += 1

      const best = next.bestTimeSec[game.id.difficulty]
      if (best === undefined || seconds < best) next.bestTimeSec = { ...next.bestTimeSec, [game.id.difficulty]: seconds }

      const c = next.completedByDifficulty[game.id.difficulty]
      const curAvg = next.avgTimeSec[game.id.difficulty] ?? seconds
      const newAvg = c <= 1 ? seconds : Math.round(curAvg + (seconds - curAvg) / c)
      next.avgTimeSec = { ...next.avgTimeSec, [game.id.difficulty]: newAvg }

      if (game.id.kind === 'daily') {
        const last = next.dailyLastDate
        const now = game.id.date ?? today()
        const prevDay = (() => {
          if (!last) return null
          const d = new Date(last)
          d.setDate(d.getDate() + 1)
          return d.toISOString().slice(0, 10)
        })()
        next.dailyStreak = prevDay === now ? next.dailyStreak + 1 : 1
        next.dailyBestStreak = Math.max(next.dailyBestStreak, next.dailyStreak)
        next.dailyLastDate = now
      }

      applyAchievements(next)
      return next
    })
    clearGame()
    setGame(null)
    playSound(settings.sound, 'complete')
    showToast('完成')
    setScreen('home')
  }

  const renderHintModal = () => {
    if (!hintOpen) return null
    return (
      <Modal
        onClose={() => {
          setHintOpen(false)
        }}
      >
        <div className="muted">提示</div>
        <Button
          wide
          onClick={() => {
            setHintOpen(false)
            doHint1()
          }}
        >
          一级：标注位置
        </Button>
        <Button
          wide
          onClick={() => {
            setHintOpen(false)
            doHint2()
          }}
        >
          二级：提示技巧
        </Button>
        <Button
          wide
          onClick={() => {
            setHintOpen(false)
            doHint3()
          }}
        >
          三级：精准填数
        </Button>
      </Modal>
    )
  }

  const renderPauseModal = () => {
    if (!pauseOpen) return null
    return (
      <Modal
        onClose={() => {
          setPauseOpen(false)
          setPaused(false)
        }}
      >
        <Button
          wide
          onClick={() => {
            setPauseOpen(false)
            setPaused(false)
          }}
        >
          继续游戏
        </Button>
        <Button
          wide
          onClick={() => {
            if (!game) return
            startGame(game.id.difficulty, game.id.kind)
          }}
        >
          重新开始
        </Button>
        <Button
          wide
          onClick={() => {
            setPauseOpen(false)
            setPaused(false)
            setScreen('home')
          }}
        >
          返回首页
        </Button>
        <Button
          wide
          onClick={() => {
            setPauseOpen(false)
            setSettingsBack('pause')
            setScreen('settings')
          }}
        >
          设置
        </Button>
      </Modal>
    )
  }

  useEffect(() => {
    if (!game) return
    if (screen !== 'game') return
    if (paused) return
    const done = isComplete(game)
    if (!done) return
    onComplete()
  }, [game?.entries, screen, paused])

  const resolvedMode = useMemo(() => resolveMode(settings.mode), [settings.mode])

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (!meta) return
    meta.content = resolvedMode === 'dark' ? '#121212' : '#F8F9FA'
  }, [resolvedMode])

  if (screen === 'home') {
    return (
      <>
        <Home
          canContinue={canContinue}
          onContinue={onContinue}
          onNewGame={(d) => startGame(d, 'normal')}
          onDaily={(d) => startGame(d, 'daily')}
          onStats={() => setScreen('stats')}
          onSettings={() => {
            setSettingsBack('home')
            setScreen('settings')
          }}
        />
        {toast}
      </>
    )
  }

  if (screen === 'settings') {
    return (
      <>
        <SettingsScreen
          value={settings}
          onChange={setSettings}
          onBack={() => {
            if (settingsBack === 'pause' && game) {
              setScreen('game')
              setPaused(true)
              setPauseOpen(true)
              return
            }
            if (settingsBack === 'game' && game) {
              setScreen('game')
              return
            }
            setScreen('home')
          }}
          onResetAll={() => {
            clearAll()
            setSettings(defaultSettings())
            setStats(defaultStats())
            setGame(null)
            showToast('已重置')
            setScreen('home')
          }}
        />
        {toast}
      </>
    )
  }

  if (screen === 'stats') {
    return (
      <>
        <StatsScreen value={stats} onBack={() => setScreen('home')} />
        {toast}
      </>
    )
  }

  if (!game) {
    return (
      <>
        <Home
          canContinue={false}
          onContinue={() => {}}
          onNewGame={(d) => startGame(d, 'normal')}
          onDaily={(d) => startGame(d, 'daily')}
          onStats={() => setScreen('stats')}
          onSettings={() => {
            setSettingsBack('home')
            setScreen('settings')
          }}
        />
        {toast}
      </>
    )
  }

  return (
    <>
      <GameScreen
        game={game}
        settings={settings}
        paused={paused}
        highlight={hintMaskState}
        globalWrong={checkMaskState}
        onLongPressCell={onLongPressCell}
        onCleanNotes={onCleanNotes}
        onCheckErrors={() => {
          setHintOpen(false)
          doCheck()
        }}
        onPause={() => {
          setPaused(true)
          setPauseOpen(true)
        }}
        onSelect={onSelect}
        onInputDigit={onInputDigit}
        onErase={onErase}
        onToggleNote={onToggleNote}
        onUndo={onUndo}
        onRedo={onRedo}
        onHint={onHint}
      />
      {renderPauseModal()}
      {renderHintModal()}
      {toast}
    </>
  )
}

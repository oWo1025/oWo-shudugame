import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { Difficulty, Settings, Stats } from './types'
import { applyAchievements } from './achievements'
import { defaultSettings, defaultStats } from './defaults'
import { clearAll, clearGame, loadGame, loadSettings, loadStats, saveGame, saveSettings, saveStats } from './storage'
import { applyTheme, onSystemThemeChange, resolveMode } from './theme'
import { createPuzzle, makeGameId } from './puzzles/puzzles'
import { createNewGame, fromSnapshot, incrementHint, inputDigit, isComplete, toSnapshot, undo, redo, toggleNoteMode, clearCell, wrongMask, type GameRuntime } from './game/game'
import { findHiddenSingleHint, findNakedSingles } from './sudoku/hints'
import { candidatesMask, rowOf, colOf, boxOf, idx } from './sudoku/grid'
import { Home } from './screens/Home'
import { SettingsScreen } from './screens/Settings'
import { StatsScreen } from './screens/Stats'
import { GameScreen } from './screens/Game'
import { VictoryScreen } from './screens/Victory'
import { ChangelogScreen } from './screens/Changelog'
import { Button, Modal, useToast } from './ui'
import { playSound } from './sound'
import { syncToCloud, syncFromCloud, clearStoredAuth, getStoredAuth, isCloudConfigured } from './cloudSync'

type Screen = 'home' | 'game' | 'stats' | 'settings' | 'victory' | 'changelog'
type ScreenDirection = 'forward' | 'backward' | 'none'
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
  const [completedHighlightState, setCompletedHighlightState] = useState<Uint8Array | null>(null)
  const [transitionDir, setTransitionDir] = useState<ScreenDirection>('none')
  const lastInputPos = useRef<number>(-1)
  const [victoryData, setVictoryData] = useState<{
    difficulty: Difficulty
    elapsedMs: number
    wrongCount: number
    hintCount: number
    entries: Uint8Array
    given: Uint8Array
  } | null>(null)

  const { toast, showToast } = useToast()

  const handleSyncNow = useCallback(async () => {
    if (!settings.cloudSync || !getStoredAuth() || !isCloudConfigured()) {
      showToast('云同步未启用')
      return
    }
    showToast('正在同步...')
    const gameSnapshot = game ? toSnapshot(game) : null
    const success = await syncToCloud({ settings, stats, game: gameSnapshot })
    if (success) {
      showToast('同步成功')
    } else {
      showToast('同步失败')
    }
  }, [settings, stats, game, showToast])

  const handleDisconnectCloud = useCallback(() => {
    clearStoredAuth()
    setSettings((s) => ({ ...s, cloudSync: false }))
    showToast('已断开云同步')
  }, [showToast])

  useEffect(() => {
    if (!settings.cloudSync || !getStoredAuth() || !isCloudConfigured()) return
    if (!game && !stats.totalCompleted) return
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const gameSnapshot = game ? toSnapshot(game) : null
        syncToCloud({ settings, stats, game: gameSnapshot }).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [settings, stats, game])

  useEffect(() => {
    if (!settings.cloudSync || !getStoredAuth() || !isCloudConfigured()) return
    const initSync = async () => {
      const cloudData = await syncFromCloud()
      if (cloudData) {
        if (cloudData.stats) {
          setStats(cloudData.stats)
        }
        if (cloudData.game && !game) {
          setGame(fromSnapshot(cloudData.game))
        }
        if (cloudData.settings) {
          setSettings(cloudData.settings)
        }
        showToast('已从云端恢复数据')
      }
    }
    initSync()
  }, [settings.cloudSync])

  const navigateTo = useCallback((next: Screen, dir: ScreenDirection = 'forward') => {
    setTransitionDir(dir)
    setTimeout(() => {
      setScreen(next)
      setTransitionDir('none')
    }, 150)
  }, [])

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
    navigateTo('game')
  }

  const onContinue = () => {
    if (!game) return
    setPaused(false)
    setPauseOpen(false)
    navigateTo('game')
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

  const checkCompletedGroups = (entries: Uint8Array, solution: Uint8Array, pos: number) => {
    const mask = new Uint8Array(81)
    let found = false
    const r = rowOf(pos)
    for (let c = 0; c < 9; c++) {
      const p = idx(r, c)
      if (entries[p] === 0 || entries[p] !== solution[p]) { found = false; break }
      found = true
    }
    if (found) {
      for (let c = 0; c < 9; c++) mask[idx(r, c)] = 1
    }
    const c = colOf(pos)
    found = false
    for (let rr = 0; rr < 9; rr++) {
      const p = idx(rr, c)
      if (entries[p] === 0 || entries[p] !== solution[p]) { found = false; break }
      found = true
    }
    if (found) {
      for (let rr = 0; rr < 9; rr++) mask[idx(rr, c)] = 1
    }
    const b = boxOf(pos)
    const br = ((b / 3) | 0) * 3
    const bc = (b % 3) * 3
    found = false
    for (let rr = 0; rr < 3; rr++) {
      for (let cc = 0; cc < 3; cc++) {
        const p = idx(br + rr, bc + cc)
        if (entries[p] === 0 || entries[p] !== solution[p]) { found = false; break }
        found = true
      }
      if (!found) break
    }
    if (found) {
      for (let rr = 0; rr < 3; rr++) {
        for (let cc = 0; cc < 3; cc++) mask[idx(br + rr, bc + cc)] = 1
      }
    }
    let any = false
    for (let i = 0; i < 81; i++) { if (mask[i]) { any = true; break } }
    if (!any) return
    setCompletedHighlightState(mask)
    playSound(settings.sound, 'groupComplete')
    window.setTimeout(() => setCompletedHighlightState(null), 1500)
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
          if (!wasNote) lastInputPos.current = pos
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
        if (!wasNote) lastInputPos.current = g.selected
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
    setVictoryData({
      difficulty: game.id.difficulty,
      elapsedMs: game.elapsedMs,
      wrongCount: game.wrongCount,
      hintCount: game.hintCount,
      entries: new Uint8Array(game.entries),
      given: new Uint8Array(game.given),
    })
    clearGame()
    setGame(null)
    playSound(settings.sound, 'complete')
    setScreen('victory')
  }

  const onVictoryReplay = () => {
    if (!victoryData) return
    setVictoryData(null)
    setPaused(false)
    setPauseOpen(false)
    const id = makeGameId(game?.id.kind ?? 'normal', victoryData.difficulty, undefined)
    const { puzzle, solution } = createPuzzle(id)
    const g = createNewGame(id, puzzle, solution)
    setGame(g)
    navigateTo('game')
  }

  const onVictoryHome = () => {
    setVictoryData(null)
    navigateTo('home')
  }

  const renderHintModal = () => {
    if (!hintOpen) return null
    const btnClick = () => playSound(settings.sound, 'click')
    return (
      <Modal
        onClose={() => {
          btnClick()
          setHintOpen(false)
        }}
      >
        <div className="hintModalHeader">
          <span className="hintModalIcon">💡</span>
          <span className="hintModalTitle">选择提示级别</span>
        </div>
        <div className="hintModalDesc">根据需要获取不同级别的帮助</div>
        <Button
          wide
          className="hintBtn hintBtn1"
          onClick={() => {
            btnClick()
            setHintOpen(false)
            doHint1()
          }}
        >
          <span className="hintBtnIcon">🔍</span>
          <span className="hintBtnContent">
            <span className="hintBtnTitle">标注可填位置</span>
            <span className="hintBtnDesc">高亮显示可直接填入的空格</span>
          </span>
        </Button>
        <Button
          wide
          className="hintBtn hintBtn2"
          onClick={() => {
            btnClick()
            setHintOpen(false)
            doHint2()
          }}
        >
          <span className="hintBtnIcon">🧩</span>
          <span className="hintBtnContent">
            <span className="hintBtnTitle">技巧提示</span>
            <span className="hintBtnDesc">显示可用的解题技巧和方法</span>
          </span>
        </Button>
        <Button
          wide
          className="hintBtn hintBtn3"
          onClick={() => {
            btnClick()
            setHintOpen(false)
            doHint3()
          }}
        >
          <span className="hintBtnIcon">🎯</span>
          <span className="hintBtnContent">
            <span className="hintBtnTitle">精准填数</span>
            <span className="hintBtnDesc">直接填入选中格子的正确答案</span>
          </span>
        </Button>
      </Modal>
    )
  }

  const renderPauseModal = () => {
    if (!pauseOpen) return null
    const btnClick = () => playSound(settings.sound, 'click')
    return (
      <Modal
        onClose={() => {
          btnClick()
          setPauseOpen(false)
          setPaused(false)
        }}
      >
        <Button
          wide
          onClick={() => {
            btnClick()
            setPauseOpen(false)
            setPaused(false)
          }}
        >
          继续游戏
        </Button>
        <Button
          wide
          onClick={() => {
            btnClick()
            if (!game) return
            startGame(game.id.difficulty, game.id.kind)
          }}
        >
          重新开始
        </Button>
        <Button
          wide
          onClick={() => {
            btnClick()
            setPauseOpen(false)
            setPaused(false)
            navigateTo('home')
          }}
        >
          返回首页
        </Button>
        <Button
          wide
          onClick={() => {
            btnClick()
            setPauseOpen(false)
            setSettingsBack('pause')
            navigateTo('settings')
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

  useEffect(() => {
    if (!game) return
    if (screen !== 'game') return
    if (paused) return
    const pos = lastInputPos.current
    if (pos < 0) return
    lastInputPos.current = -1
    if (game.entries[pos] === 0) return
    checkCompletedGroups(game.entries, game.solution, pos)
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
          onStats={() => {
            navigateTo('stats', 'forward')
          }}
          onSettings={() => {
            setSettingsBack('home')
            navigateTo('settings', 'forward')
          }}
          soundOn={settings.sound}
          animateIn={transitionDir === 'none'}
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
              navigateTo('game', 'backward')
              setPaused(true)
              setPauseOpen(true)
              return
            }
            if (settingsBack === 'game' && game) {
              navigateTo('game', 'backward')
              return
            }
            navigateTo('home', 'backward')
          }}
          onResetAll={() => {
            clearAll()
            setSettings(defaultSettings())
            setStats(defaultStats())
            setGame(null)
            showToast('已重置')
            navigateTo('home', 'backward')
          }}
          onChangelog={() => navigateTo('changelog', 'forward')}
          onSyncNow={handleSyncNow}
          onDisconnectCloud={handleDisconnectCloud}
        />
        {toast}
      </>
    )
  }

  if (screen === 'stats') {
    return (
      <>
        <StatsScreen value={stats} onBack={() => navigateTo('home', 'backward')} />
        {toast}
      </>
    )
  }

  if (screen === 'changelog') {
    return (
      <>
        <ChangelogScreen
          soundOn={settings.sound}
          onBack={() => navigateTo('settings', 'backward')}
        />
        {toast}
      </>
    )
  }

  if (screen === 'victory' && victoryData) {
    return (
      <>
        <VictoryScreen
          difficulty={victoryData.difficulty}
          elapsedMs={victoryData.elapsedMs}
          wrongCount={victoryData.wrongCount}
          hintCount={victoryData.hintCount}
          entries={victoryData.entries}
          given={victoryData.given}
          onReplay={onVictoryReplay}
          onHome={onVictoryHome}
          soundOn={settings.sound}
        />
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
          onStats={() => {
            navigateTo('stats', 'forward')
          }}
          onSettings={() => {
            setSettingsBack('home')
            navigateTo('settings', 'forward')
          }}
          soundOn={settings.sound}
          animateIn={transitionDir === 'none'}
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
        completedHighlight={completedHighlightState}
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

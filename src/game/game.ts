import type { GameId, GameSnapshot } from '../types'
import { decodeDigits, decodeNotes, encodeDigits, encodeNotes, packState, unpackState } from './codec'
import { parseGrid } from '../sudoku/grid'

export type GameRuntime = {
  id: GameId
  puzzle: Uint8Array
  solution: Uint8Array
  given: Uint8Array
  entries: Uint8Array
  notes: Uint16Array
  noteMode: boolean
  selected: number
  selectedDigit: number
  undo: string[]
  redo: string[]
  startedAt: number
  elapsedMs: number
  wrongCount: number
  hintCount: number
}

const makeGiven = (puzzle: Uint8Array) => {
  const out = new Uint8Array(81)
  for (let i = 0; i < 81; i++) out[i] = puzzle[i] === 0 ? 0 : 1
  return out
}

export const createNewGame = (id: GameId, puzzleStr: string, solutionStr: string): GameRuntime => {
  const puzzle = parseGrid(puzzleStr)
  const solution = parseGrid(solutionStr)
  const given = makeGiven(puzzle)
  const entries = new Uint8Array(puzzle)
  const notes = new Uint16Array(81)
  return {
    id,
    puzzle,
    solution,
    given,
    entries,
    notes,
    noteMode: false,
    selected: -1,
    selectedDigit: 0,
    undo: [],
    redo: [],
    startedAt: Date.now(),
    elapsedMs: 0,
    wrongCount: 0,
    hintCount: 0,
  }
}

export const toSnapshot = (g: GameRuntime): GameSnapshot => ({
  version: 1,
  id: g.id,
  startedAt: g.startedAt,
  elapsedMs: g.elapsedMs,
  puzzle: encodeDigits(g.puzzle),
  solution: encodeDigits(g.solution),
  given: Array.from(g.given, (v) => (v ? '1' : '0')).join(''),
  entries: encodeDigits(g.entries),
  notes: encodeNotes(g.notes),
  noteMode: g.noteMode,
  selected: g.selected,
  selectedDigit: g.selectedDigit,
  undo: g.undo,
  redo: g.redo,
})

export const fromSnapshot = (s: GameSnapshot): GameRuntime => {
  const puzzle = decodeDigits(s.puzzle)
  const solution = decodeDigits(s.solution)
  const given = new Uint8Array(81)
  for (let i = 0; i < 81; i++) given[i] = s.given[i] === '1' ? 1 : 0
  return {
    id: s.id,
    puzzle,
    solution,
    given,
    entries: decodeDigits(s.entries),
    notes: decodeNotes(s.notes),
    noteMode: s.noteMode,
    selected: s.selected,
    selectedDigit: s.selectedDigit,
    undo: s.undo ?? [],
    redo: s.redo ?? [],
    startedAt: s.startedAt,
    elapsedMs: s.elapsedMs ?? 0,
    wrongCount: 0,
    hintCount: 0,
  }
}

const pushUndo = (g: GameRuntime) => {
  const packed = packState(encodeDigits(g.entries), encodeNotes(g.notes), g.noteMode)
  g.undo.push(packed)
  if (g.undo.length > 500) g.undo.shift()
  g.redo.length = 0
}

export const undo = (g: GameRuntime) => {
  const prev = g.undo.pop()
  if (!prev) return false
  const now = packState(encodeDigits(g.entries), encodeNotes(g.notes), g.noteMode)
  g.redo.push(now)
  const u = unpackState(prev)
  g.entries = decodeDigits(u.entries)
  g.notes = decodeNotes(u.notes)
  g.noteMode = u.noteMode
  return true
}

export const redo = (g: GameRuntime) => {
  const next = g.redo.pop()
  if (!next) return false
  const now = packState(encodeDigits(g.entries), encodeNotes(g.notes), g.noteMode)
  g.undo.push(now)
  const u = unpackState(next)
  g.entries = decodeDigits(u.entries)
  g.notes = decodeNotes(u.notes)
  g.noteMode = u.noteMode
  return true
}

export const toggleNoteMode = (g: GameRuntime) => {
  pushUndo(g)
  g.noteMode = !g.noteMode
}

export const clearCell = (g: GameRuntime, pos: number) => {
  if (pos < 0 || pos >= 81) return false
  if (g.given[pos]) return false
  if (g.entries[pos] === 0 && g.notes[pos] === 0) return false
  pushUndo(g)
  g.entries[pos] = 0
  g.notes[pos] = 0
  return true
}

export const inputDigit = (g: GameRuntime, pos: number, digit: number) => {
  if (pos < 0 || pos >= 81) return false
  if (g.given[pos]) return false
  if (digit < 1 || digit > 9) return false

  pushUndo(g)

  if (g.noteMode) {
    if (g.entries[pos] !== 0) g.entries[pos] = 0
    const bit = 1 << (digit - 1)
    g.notes[pos] = g.notes[pos] ^ bit
  } else {
    g.entries[pos] = digit
    g.notes[pos] = 0
    if (digit !== g.solution[pos]) g.wrongCount++
  }

  return true
}

export const isComplete = (g: GameRuntime) => {
  for (let i = 0; i < 81; i++) if (g.entries[i] !== g.solution[i]) return false
  return true
}

export const wrongMask = (g: GameRuntime) => {
  const out = new Uint8Array(81)
  for (let i = 0; i < 81; i++) {
    if (!g.given[i] && g.entries[i] !== 0 && g.entries[i] !== g.solution[i]) out[i] = 1
  }
  return out
}

export const incrementHint = (g: GameRuntime) => {
  g.hintCount++
}


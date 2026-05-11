import type { Difficulty, GameId, GameKind } from '../types'
import { countSolutions } from '../sudoku/solver'
import { parseGrid, gridToString } from '../sudoku/grid'
import { hashStringToSeed, makeRng } from '../sudoku/rng'
import { applyIso, makeIso } from '../sudoku/transform'
import { LIBRARY } from './library'

const clueCount = (puzzle: string) => {
  let n = 0
  for (let i = 0; i < 81; i++) if (puzzle[i] !== '0') n++
  return n
}

const rangeFor = (d: Difficulty) => {
  if (d === 'beginner') return { min: 36, max: 40, target: 38 }
  if (d === 'easy') return { min: 32, max: 35, target: 33 }
  if (d === 'medium') return { min: 28, max: 31, target: 30 }
  if (d === 'hard') return { min: 24, max: 27, target: 26 }
  if (d === 'expert') return { min: 20, max: 23, target: 22 }
  return { min: 17, max: 17, target: 17 }
}

const pickFromRange = (d: Difficulty) => {
  const r = rangeFor(d)
  return LIBRARY.filter((p) => {
    const c = clueCount(p.puzzle)
    return c >= r.min && c <= r.max
  })
}

const genPuzzleFromSolution = (solution: string, targetClues: number, seed: number) => {
  const rng = makeRng(seed)
  const g = parseGrid(solution)
  const order = Array.from({ length: 81 }, (_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1)
    const t = order[i]
    order[i] = order[j]
    order[j] = t
  }

  let clues = 81
  const removed: number[] = []

  for (const pos of order) {
    if (clues <= targetClues) break
    const prev = g[pos]
    if (prev === 0) continue
    g[pos] = 0
    const puzzle = gridToString(g)
    if (countSolutions(puzzle, 2) === 1) {
      removed.push(pos)
      clues--
    } else {
      g[pos] = prev
    }
  }

  if (clues > targetClues) {
    for (let tries = 0; tries < 6 && clues > targetClues; tries++) {
      const idx = rng.nextInt(removed.length)
      const pos = removed[idx]
      const prev = parseInt(solution[pos]!, 10)
      if (g[pos] !== 0) continue
      g[pos] = prev
      const puzzleNow = gridToString(g)
      if (countSolutions(puzzleNow, 2) === 1) {
        removed.splice(idx, 1)
        clues++
      } else {
        g[pos] = 0
      }
      const pos2 = rng.nextInt(81)
      if (g[pos2] !== 0 && clues > targetClues) {
        const prev2 = g[pos2]
        g[pos2] = 0
        const puzzle2 = gridToString(g)
        if (countSolutions(puzzle2, 2) === 1) {
          removed.push(pos2)
          clues--
        } else {
          g[pos2] = prev2
        }
      }
    }
  }

  return gridToString(g)
}

const derivePair = (d: Difficulty, seed: number) => {
  const list = pickFromRange(d)
  if (list.length > 0) return list[seed % list.length]

  const base = LIBRARY[seed % LIBRARY.length]!
  const { target } = rangeFor(d)
  const puzzle = genPuzzleFromSolution(base.solution, target, seed ^ 0x9e3779b9)
  return { puzzle, solution: base.solution }
}

export const makeGameId = (kind: GameKind, difficulty: Difficulty, date?: string): GameId => {
  if (kind === 'daily') {
    const d = date ?? new Date().toISOString().slice(0, 10)
    const seed = hashStringToSeed(`${kind}:${difficulty}:${d}`)
    return { kind, difficulty, seed, date: d }
  }
  const seed = (Math.random() * 0xffffffff) >>> 0
  return { kind, difficulty, seed }
}

export const createPuzzle = (id: GameId) => {
  const base = derivePair(id.difficulty, id.seed)
  const rng = makeRng(id.seed ^ 0xa5a5a5a5)
  const iso = makeIso(rng)
  const t = applyIso(base.puzzle, base.solution, iso)
  return { puzzle: t.puzzle, solution: t.solution }
}


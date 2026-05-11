import type { Rng } from './rng'
import { idx, parseGrid, gridToString } from './grid'

const shuffle = (rng: Rng, arr: number[]) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1)
    const t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
  }
  return arr
}

export type Iso = {
  rows: number[]
  cols: number[]
  digits: number[]
}

export const makeIso = (rng: Rng): Iso => {
  const bandOrder = shuffle(rng, [0, 1, 2])
  const stackOrder = shuffle(rng, [0, 1, 2])

  const rows: number[] = []
  const cols: number[] = []

  for (const b of bandOrder) {
    const inside = shuffle(rng, [0, 1, 2])
    for (const r of inside) rows.push(b * 3 + r)
  }

  for (const s of stackOrder) {
    const inside = shuffle(rng, [0, 1, 2])
    for (const c of inside) cols.push(s * 3 + c)
  }

  const digits = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9])
  return { rows, cols, digits }
}

export const applyIsoToGrid = (grid: Uint8Array, iso: Iso) => {
  const out = new Uint8Array(81)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[idx(iso.rows[r], iso.cols[c])]
      out[idx(r, c)] = v === 0 ? 0 : iso.digits[v - 1]
    }
  }
  return out
}

export const applyIso = (puzzle: string, solution: string, iso: Iso) => {
  const p = applyIsoToGrid(parseGrid(puzzle), iso)
  const s = applyIsoToGrid(parseGrid(solution), iso)
  return { puzzle: gridToString(p), solution: gridToString(s) }
}


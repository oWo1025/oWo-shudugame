import { candidatesMask, countBits, parseGrid } from './grid'

type SolveResult = {
  solved: Uint8Array | null
  count: number
}

const clone = (g: Uint8Array) => new Uint8Array(g)

const findBestEmpty = (g: Uint8Array) => {
  let bestPos = -1
  let bestMask = 0
  let bestCount = 10
  for (let i = 0; i < 81; i++) {
    if (g[i] !== 0) continue
    const m = candidatesMask(g, i)
    const c = countBits(m)
    if (c === 0) return { pos: i, mask: 0, count: 0 }
    if (c < bestCount) {
      bestCount = c
      bestPos = i
      bestMask = m
      if (c === 1) break
    }
  }
  return { pos: bestPos, mask: bestMask, count: bestCount }
}

const dfs = (g: Uint8Array, limit: number, acc: SolveResult): void => {
  if (acc.count >= limit) return
  const { pos, mask, count } = findBestEmpty(g)
  if (pos === -1) {
    acc.count++
    if (!acc.solved) acc.solved = clone(g)
    return
  }
  if (count === 0) return

  for (let d = 1; d <= 9; d++) {
    if (!(mask & (1 << (d - 1)))) continue
    g[pos] = d
    dfs(g, limit, acc)
    g[pos] = 0
    if (acc.count >= limit) return
  }
}

export const solveUnique = (puzzle: string) => {
  const g = parseGrid(puzzle)
  const acc: SolveResult = { solved: null, count: 0 }
  dfs(g, 2, acc)
  return acc.count === 1 ? acc.solved : null
}

export const countSolutions = (puzzle: string, limit = 2) => {
  const g = parseGrid(puzzle)
  const acc: SolveResult = { solved: null, count: 0 }
  dfs(g, limit, acc)
  return acc.count
}


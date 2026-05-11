import { boxOf, candidatesMask, colOf, countBits, maskToDigits, rowOf } from './grid'

export type Level2Hint = {
  message: string
  highlight: number[]
}

export const findNakedSingles = (g: Uint8Array) => {
  const out: number[] = []
  for (let i = 0; i < 81; i++) {
    if (g[i] !== 0) continue
    const m = candidatesMask(g, i)
    if (countBits(m) === 1) out.push(i)
  }
  return out
}

const unitIndices = (unit: 'row' | 'col' | 'box', n: number) => {
  const out: number[] = []
  if (unit === 'row') {
    const r = n
    for (let c = 0; c < 9; c++) out.push(r * 9 + c)
    return out
  }
  if (unit === 'col') {
    const c = n
    for (let r = 0; r < 9; r++) out.push(r * 9 + c)
    return out
  }
  const br = ((n / 3) | 0) * 3
  const bc = (n % 3) * 3
  for (let rr = 0; rr < 3; rr++) for (let cc = 0; cc < 3; cc++) out.push((br + rr) * 9 + (bc + cc))
  return out
}

export const findHiddenSingleHint = (g: Uint8Array): Level2Hint | null => {
  const units: Array<{ unit: 'row' | 'col' | 'box'; label: (n: number) => string }> = [
    { unit: 'row', label: (n) => `第 ${n + 1} 行` },
    { unit: 'col', label: (n) => `第 ${n + 1} 列` },
    { unit: 'box', label: (n) => `第 ${n + 1} 宫` },
  ]

  for (const u of units) {
    for (let n = 0; n < 9; n++) {
      const idxs = unitIndices(u.unit, n)
      const seen = new Array<number>(10).fill(0)
      const lastPos = new Array<number>(10).fill(-1)
      for (const pos of idxs) {
        if (g[pos] !== 0) continue
        const m = candidatesMask(g, pos)
        for (const d of maskToDigits(m)) {
          seen[d]++
          lastPos[d] = pos
        }
      }
      for (let d = 1; d <= 9; d++) {
        if (seen[d] === 1) {
          const message =
            u.unit === 'row'
              ? `${u.label(n)}存在行摒除，可确定数字 ${d} 的位置`
              : u.unit === 'col'
                ? `${u.label(n)}存在列摒除，可确定数字 ${d} 的位置`
                : `${u.label(n)}存在宫摒除，可确定数字 ${d} 的位置`
          return { message, highlight: idxs }
        }
      }
    }
  }
  return null
}

export const relatedToCell = (pos: number) => {
  const r = rowOf(pos)
  const c = colOf(pos)
  const b = boxOf(pos)
  return { r, c, b }
}


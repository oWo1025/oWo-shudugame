export const parseGrid = (s: string) => {
  const out = new Uint8Array(81)
  for (let i = 0; i < 81; i++) {
    const ch = s[i] ?? '0'
    const v = ch === '.' ? 0 : (ch.charCodeAt(0) - 48) | 0
    out[i] = v >= 1 && v <= 9 ? v : 0
  }
  return out
}

export const gridToString = (g: Uint8Array) => {
  let s = ''
  for (let i = 0; i < 81; i++) s += g[i] === 0 ? '0' : String(g[i])
  return s
}

export const rowOf = (i: number) => (i / 9) | 0
export const colOf = (i: number) => i % 9
export const boxOf = (i: number) => (((rowOf(i) / 3) | 0) * 3 + ((colOf(i) / 3) | 0)) | 0

export const idx = (r: number, c: number) => r * 9 + c

export const isValidPlacement = (g: Uint8Array, pos: number, value: number) => {
  if (value < 1 || value > 9) return false
  const r = rowOf(pos)
  const c = colOf(pos)
  const br = ((r / 3) | 0) * 3
  const bc = ((c / 3) | 0) * 3

  for (let k = 0; k < 9; k++) {
    const vRow = g[idx(r, k)]
    if (k !== c && vRow === value) return false
    const vCol = g[idx(k, c)]
    if (k !== r && vCol === value) return false
  }

  for (let rr = 0; rr < 3; rr++) {
    for (let cc = 0; cc < 3; cc++) {
      const p = idx(br + rr, bc + cc)
      if (p !== pos && g[p] === value) return false
    }
  }

  return true
}

export const candidatesMask = (g: Uint8Array, pos: number) => {
  if (g[pos] !== 0) return 0
  let mask = 0
  for (let d = 1; d <= 9; d++) {
    if (isValidPlacement(g, pos, d)) mask |= 1 << (d - 1)
  }
  return mask
}

export const maskToDigits = (mask: number) => {
  const out: number[] = []
  for (let d = 1; d <= 9; d++) if (mask & (1 << (d - 1))) out.push(d)
  return out
}

export const countBits = (x: number) => {
  let n = 0
  while (x) {
    x &= x - 1
    n++
  }
  return n
}

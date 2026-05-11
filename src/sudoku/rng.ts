export type Rng = {
  nextU32: () => number
  nextInt: (maxExclusive: number) => number
}

export const makeRng = (seed: number): Rng => {
  let x = seed | 0
  const nextU32 = () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return x >>> 0
  }
  const nextInt = (maxExclusive: number) => {
    if (maxExclusive <= 0) return 0
    return nextU32() % maxExclusive
  }
  return { nextU32, nextInt }
}

export const hashStringToSeed = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

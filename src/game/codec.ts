export const encodeDigits = (arr: Uint8Array) => {
  let s = ''
  for (let i = 0; i < 81; i++) s += arr[i] === 0 ? '0' : String(arr[i])
  return s
}

export const decodeDigits = (s: string) => {
  const a = new Uint8Array(81)
  for (let i = 0; i < 81; i++) {
    const ch = s[i] ?? '0'
    const v = ch.charCodeAt(0) - 48
    a[i] = v >= 1 && v <= 9 ? v : 0
  }
  return a
}

export const encodeNotes = (arr: Uint16Array) => {
  let s = ''
  for (let i = 0; i < 81; i++) s += arr[i].toString(36).padStart(2, '0')
  return s
}

export const decodeNotes = (s: string) => {
  const a = new Uint16Array(81)
  for (let i = 0; i < 81; i++) {
    const chunk = s.slice(i * 2, i * 2 + 2)
    a[i] = chunk ? parseInt(chunk, 36) : 0
  }
  return a
}

export const packState = (entries: string, notes: string, noteMode: boolean) =>
  `${entries}|${notes}|${noteMode ? '1' : '0'}`

export const unpackState = (packed: string) => {
  const [entries = '', notes = '', mode = '0'] = packed.split('|')
  return { entries, notes, noteMode: mode === '1' }
}

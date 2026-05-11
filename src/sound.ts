type SoundName = 'place' | 'erase' | 'note' | 'error' | 'hint' | 'complete' | 'undo' | 'check' | 'toggle'

let ctx: AudioContext | null = null
let resuming = false

const ensureCtx = async (): Promise<AudioContext | null> => {
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended' && !resuming) {
      resuming = true
      await ctx.resume()
      resuming = false
    }
    if (ctx.state === 'running') return ctx
    return null
  } catch {
    return null
  }
}

const playTone = async (freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15, delay = 0) => {
  const c = await ensureCtx()
  if (!c) return
  const t = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + duration)
}

const sounds: Record<SoundName, () => Promise<void>> = {
  async place() {
    await playTone(600, 0.08, 'sine', 0.12)
    await playTone(900, 0.06, 'sine', 0.08, 0.03)
  },

  async erase() {
    await playTone(400, 0.1, 'triangle', 0.1)
  },

  async note() {
    await playTone(500, 0.06, 'sine', 0.08)
    await playTone(700, 0.06, 'sine', 0.08, 0.05)
  },

  async error() {
    await playTone(200, 0.15, 'square', 0.08)
    await playTone(180, 0.2, 'square', 0.06, 0.1)
  },

  async hint() {
    await playTone(800, 0.08, 'sine', 0.1)
    await playTone(1000, 0.08, 'sine', 0.1, 0.06)
    await playTone(1200, 0.12, 'sine', 0.08, 0.12)
  },

  async complete() {
    const notes = [523, 659, 784, 1047]
    for (let i = 0; i < notes.length; i++) {
      await playTone(notes[i], 0.25, 'sine', 0.12, i * 0.12)
    }
  },

  async undo() {
    await playTone(500, 0.06, 'triangle', 0.08)
    await playTone(350, 0.08, 'triangle', 0.06, 0.04)
  },

  async check() {
    await playTone(700, 0.08, 'sine', 0.1)
    await playTone(600, 0.1, 'sine', 0.08, 0.06)
  },

  async toggle() {
    await playTone(550, 0.05, 'sine', 0.08)
  },
}

export const playSound = (on: boolean, name: SoundName) => {
  if (!on) return
  sounds[name]().catch(() => {})
}

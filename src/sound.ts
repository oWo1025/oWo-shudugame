type SoundName = 'place' | 'erase' | 'note' | 'error' | 'hint' | 'complete' | 'undo' | 'check' | 'toggle' | 'groupComplete' | 'hover' | 'click'

let ctx: AudioContext | null = null
let resumePromise: Promise<void> | null = null

const ensureCtx = (): Promise<AudioContext | null> => {
  try {
    if (!ctx) {
      ctx = new AudioContext()
    }
    if (ctx.state === 'running') return Promise.resolve(ctx)

    if (!resumePromise) {
      resumePromise = ctx.resume().then(() => {
        resumePromise = null
      }).catch(() => {
        resumePromise = null
      })
    }

    return resumePromise.then(() => {
      if (ctx && ctx.state === 'running') return ctx
      return null
    })
  } catch {
    return Promise.resolve(null)
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

const warmUp = () => {
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return
    }
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}

if (typeof document !== 'undefined') {
  const events = ['click', 'touchstart', 'touchend', 'keydown'] as const
  const handler = () => {
    warmUp()
    events.forEach((e) => document.removeEventListener(e, handler))
  }
  events.forEach((e) => document.addEventListener(e, handler, { passive: true }))
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

  async groupComplete() {
    await playTone(660, 0.1, 'sine', 0.1)
    await playTone(880, 0.1, 'sine', 0.1, 0.08)
    await playTone(1100, 0.15, 'sine', 0.08, 0.16)
  },

  async hover() {
    await playTone(1200, 0.04, 'sine', 0.06)
  },

  async click() {
    await playTone(800, 0.05, 'sine', 0.1)
    await playTone(1000, 0.04, 'sine', 0.06, 0.02)
  },
}

export const playSound = (on: boolean, name: SoundName) => {
  if (!on) return
  sounds[name]().catch(() => {})
}

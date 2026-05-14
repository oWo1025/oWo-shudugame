import type { CloudSyncData } from './types'
import { syncToCloud, getStoredAuth } from './cloudSync'

const KEY_PENDING_SYNC = 'sudoku.pendingSync.v1'
const MAX_RETRIES = 5
const RETRY_INTERVAL_MS = 60000

interface PendingSync {
  data: CloudSyncData
  retries: number
  lastAttempt: number
}

let retryTimer: ReturnType<typeof setInterval> | null = null
let onlineHandler: (() => void) | null = null

const loadPending = (): PendingSync | null => {
  try {
    const raw = localStorage.getItem(KEY_PENDING_SYNC)
    if (!raw) return null
    return JSON.parse(raw) as PendingSync
  } catch {
    return null
  }
}

const savePending = (pending: PendingSync | null) => {
  if (pending) {
    localStorage.setItem(KEY_PENDING_SYNC, JSON.stringify(pending))
  } else {
    localStorage.removeItem(KEY_PENDING_SYNC)
  }
}

const attemptRetry = async () => {
  const pending = loadPending()
  if (!pending) return

  const auth = getStoredAuth()
  if (!auth) {
    savePending(null)
    return
  }

  const now = Date.now()

  if (now - pending.lastAttempt < 30000) return

  pending.retries++
  pending.lastAttempt = now

  const result = await syncToCloud({
    settings: pending.data.settings,
    stats: pending.data.stats,
    game: pending.data.game,
  })

  if (result.success) {
    savePending(null)
  } else if (pending.retries >= MAX_RETRIES) {
    savePending(null)
  } else {
    savePending(pending)
  }
}

export const enqueuePendingSync = (data: CloudSyncData) => {
  const existing = loadPending()
  if (existing) {
    existing.data = data
    existing.lastAttempt = 0
    savePending(existing)
  } else {
    savePending({ data, retries: 0, lastAttempt: 0 })
  }
}

export const hasPendingSync = (): boolean => {
  return !!loadPending()
}

export const startRetryScheduler = () => {
  stopRetryScheduler()

  retryTimer = setInterval(() => {
    if (navigator.onLine && loadPending()) {
      attemptRetry()
    }
  }, RETRY_INTERVAL_MS)

  onlineHandler = () => {
    if (loadPending()) {
      attemptRetry()
    }
  }
  window.addEventListener('online', onlineHandler)
}

export const stopRetryScheduler = () => {
  if (retryTimer) {
    clearInterval(retryTimer)
    retryTimer = null
  }
  if (onlineHandler) {
    window.removeEventListener('online', onlineHandler)
    onlineHandler = null
  }
}

export const retryNow = async (): Promise<boolean> => {
  const pending = loadPending()
  if (!pending) return false

  await attemptRetry()
  return !loadPending()
}

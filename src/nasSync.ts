import type { CloudSyncAuth, CloudSyncData, GameSnapshot, Settings, Stats } from './types'
import { getStoredAuth } from './cloudSync'

const KEY_NAS_CONFIG = 'sudoku.nasConfig.v1'
const KEY_LAST_SYNC = 'sudoku.lastSync.v1'
const KEY_SYNC_VERSION = 'sudoku.syncVersion.v1'

export type NasConfig = {
  serverUrl: string
  username: string
  password: string
  path: string
}

export const getStoredNasConfig = (): NasConfig | null => {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(KEY_NAS_CONFIG)
  return data ? JSON.parse(data) : null
}

export const setStoredNasConfig = (config: NasConfig): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY_NAS_CONFIG, JSON.stringify(config))
}

export const clearStoredNasConfig = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY_NAS_CONFIG)
}

export const isNasConfigured = (): boolean => {
  const config = getStoredNasConfig()
  return !!(config?.serverUrl && config?.username && config?.password)
}

const generateUserId = (auth: CloudSyncAuth): string => {
  return btoa(`${auth.nickname.toLowerCase()}:${auth.pin}`).replace(/[^a-zA-Z0-9]/g, '')
}

const getDataFileName = (auth: CloudSyncAuth): string => {
  return `sudoku_${generateUserId(auth)}.json`
}

const buildAuthHeader = (username: string, password: string): string => {
  return 'Basic ' + btoa(`${username}:${password}`)
}

export const syncToNas = async (data: {
  settings: Settings
  stats: Stats
  game: GameSnapshot | null
}): Promise<boolean> => {
  const config = getStoredNasConfig()
  if (!config) return false

  const auth = getStoredAuth()
  if (!auth) return false

  const currentVersion = parseInt(localStorage.getItem(KEY_SYNC_VERSION) || '0', 10)
  const newVersion = currentVersion + 1

  const syncData: CloudSyncData = {
    settings: data.settings,
    stats: data.stats,
    game: data.game,
    syncedAt: Date.now(),
    version: newVersion,
  }

  const fileName = getDataFileName(auth)
  const filePath = config.path.endsWith('/') ? config.path + fileName : `${config.path}/${fileName}`
  const url = `${config.serverUrl.replace(/\/$/, '')}${filePath}`

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': buildAuthHeader(config.username, config.password),
      },
      body: JSON.stringify(syncData),
    })

    if (!response.ok && response.status !== 201 && response.status !== 204) {
      console.error('NAS sync failed:', response.status, response.statusText)
      return false
    }

    localStorage.setItem(KEY_LAST_SYNC, Date.now().toString())
    localStorage.setItem(KEY_SYNC_VERSION, newVersion.toString())
    return true
  } catch (e) {
    console.error('NAS sync error:', e)
    return false
  }
}

export const syncFromNas = async (): Promise<CloudSyncData | null> => {
  const config = getStoredNasConfig()
  if (!config) return null

  const auth = getStoredAuth()
  if (!auth) return null

  const fileName = getDataFileName(auth)
  const filePath = config.path.endsWith('/') ? config.path + fileName : `${config.path}/${fileName}`
  const url = `${config.serverUrl.replace(/\/$/, '')}${filePath}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password),
      },
    })

    if (!response.ok) {
      if (response.status === 404) return null
      console.error('NAS fetch failed:', response.status, response.statusText)
      return null
    }

    const cloudData = (await response.json()) as CloudSyncData
    localStorage.setItem(KEY_LAST_SYNC, Date.now().toString())
    localStorage.setItem(KEY_SYNC_VERSION, (cloudData.version || 0).toString())

    return cloudData
  } catch (e) {
    console.error('NAS fetch error:', e)
    return null
  }
}

export const testNasConnection = async (config: NasConfig): Promise<{ success: boolean; error?: string }> => {
  try {
    const testUrl = `${config.serverUrl.replace(/\/$/, '')}/${config.path.replace(/^\//, '')}`
    const response = await fetch(testUrl, {
      method: 'PROPFIND',
      headers: {
        'Authorization': buildAuthHeader(config.username, config.password),
        'Content-Type': 'application/xml',
        'Depth': '0',
      },
    })

    if (response.ok || response.status === 207) {
      return { success: true }
    }

    return { success: false, error: `服务器返回 ${response.status}` }
  } catch (e) {
    return { success: false, error: '无法连接到服务器' }
  }
}

export const getLastSyncAt = (): number | null => {
  if (typeof window === 'undefined') return null
  const ts = localStorage.getItem(KEY_LAST_SYNC)
  return ts ? parseInt(ts, 10) : null
}

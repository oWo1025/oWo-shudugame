import type { CloudSyncAuth, CloudSyncData, GameSnapshot, Settings, Stats } from './types'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const KEY_CLOUD_AUTH = 'sudoku.cloudAuth.v1'
const KEY_LAST_SYNC = 'sudoku.lastSync.v1'
const KEY_SYNC_VERSION = 'sudoku.syncVersion.v1'
const KEY_NAS_CONFIG = 'sudoku.nasConfig.v1'

let supabaseClient: SupabaseClient | null = null

let envVars: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string } = {}

try {
  if (typeof window !== 'undefined') {
    const metaUrl = document.querySelector('meta[name="supabase-url"]') as HTMLMetaElement
    const metaKey = document.querySelector('meta[name="supabase-key"]') as HTMLMetaElement
    if (metaUrl?.content) envVars.SUPABASE_URL = metaUrl.content
    if (metaKey?.content) envVars.SUPABASE_ANON_KEY = metaKey.content
  }
} catch {}

export const setEnvConfig = (config: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string }) => {
  envVars = { ...envVars, ...config }
  if (envVars.SUPABASE_URL && envVars.SUPABASE_ANON_KEY) {
    supabaseClient = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_ANON_KEY)
  }
}

export const isSupabaseConfigured = (): boolean => {
  return !!(envVars.SUPABASE_URL && envVars.SUPABASE_ANON_KEY)
}

export const isNasConfigured = (): boolean => {
  if (typeof window === 'undefined') return false
  const configData = localStorage.getItem(KEY_NAS_CONFIG)
  if (!configData) return false
  try {
    const config = JSON.parse(configData)
    return !!(config.serverUrl && config.username && config.password)
  } catch {
    return false
  }
}

export const isCloudConfigured = (): boolean => {
  return isSupabaseConfigured() || isNasConfigured()
}

export const getStoredAuth = (): CloudSyncAuth | null => {
  const data = localStorage.getItem(KEY_CLOUD_AUTH)
  return data ? JSON.parse(data) : null
}

export const setStoredAuth = (auth: CloudSyncAuth): void => {
  localStorage.setItem(KEY_CLOUD_AUTH, JSON.stringify(auth))
}

export const clearStoredAuth = (): void => {
  localStorage.removeItem(KEY_CLOUD_AUTH)
}

const generateUserId = (auth: CloudSyncAuth): string => {
  return btoa(`${auth.nickname.toLowerCase()}:${auth.pin}`).replace(/[^a-zA-Z0-9]/g, '')
}

const getStoredNasConfig = (): { serverUrl: string; username: string; password: string; path: string } | null => {
  if (typeof window === 'undefined') return null
  const configData = localStorage.getItem(KEY_NAS_CONFIG)
  return configData ? JSON.parse(configData) : null
}

const getNasDataFileName = (auth: CloudSyncAuth): string => {
  return `sudoku_${generateUserId(auth)}.json`
}

const getNasAuthHeader = (username: string, password: string): string => {
  return 'Basic ' + btoa(`${username}:${password}`)
}

const syncToNas = async (data: CloudSyncData, auth: CloudSyncAuth): Promise<boolean> => {
  const config = getStoredNasConfig()
  if (!config) return false

  const fileName = getNasDataFileName(auth)
  const filePath = config.path.endsWith('/') ? config.path + fileName : `${config.path}/${fileName}`
  const url = `${config.serverUrl.replace(/\/$/, '')}${filePath}`

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getNasAuthHeader(config.username, config.password),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok && response.status !== 201 && response.status !== 204) {
      console.error('NAS sync failed:', response.status, response.statusText)
      return false
    }

    return true
  } catch (e) {
    console.error('NAS sync error:', e)
    return false
  }
}

const syncFromNas = async (auth: CloudSyncAuth): Promise<CloudSyncData | null> => {
  const config = getStoredNasConfig()
  if (!config) return null

  const fileName = getNasDataFileName(auth)
  const filePath = config.path.endsWith('/') ? config.path + fileName : `${config.path}/${fileName}`
  const url = `${config.serverUrl.replace(/\/$/, '')}${filePath}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': getNasAuthHeader(config.username, config.password),
      },
    })

    if (!response.ok) {
      if (response.status === 404) return null
      console.error('NAS fetch failed:', response.status, response.statusText)
      return null
    }

    return (await response.json()) as CloudSyncData
  } catch (e) {
    console.error('NAS fetch error:', e)
    return null
  }
}

const syncToSupabase = async (data: CloudSyncData, auth: CloudSyncAuth): Promise<boolean> => {
  if (!supabaseClient) return false

  const userId = generateUserId(auth)

  try {
    const { error } = await supabaseClient
      .from('sudoku_save')
      .upsert({ id: userId, data: data, updated_at: new Date().toISOString() }, { onConflict: 'id' })

    if (error) {
      console.error('Supabase sync failed:', error)
      return false
    }

    return true
  } catch (e) {
    console.error('Supabase sync error:', e)
    return false
  }
}

const syncFromSupabase = async (auth: CloudSyncAuth): Promise<CloudSyncData | null> => {
  if (!supabaseClient) return null

  const userId = generateUserId(auth)

  try {
    const { data, error } = await supabaseClient
      .from('sudoku_save')
      .select('data')
      .eq('id', userId)
      .single()

    if (error || !data) {
      if (error?.code === 'PGRST116') return null
      console.error('Supabase fetch failed:', error)
      return null
    }

    return data.data as CloudSyncData
  } catch (e) {
    console.error('Supabase fetch error:', e)
    return null
  }
}

export const syncToCloud = async (data: {
  settings: Settings
  stats: Stats
  game: GameSnapshot | null
}): Promise<{ success: boolean; nasSuccess: boolean; supabaseSuccess: boolean }> => {
  const auth = getStoredAuth()
  if (!auth) return { success: false, nasSuccess: false, supabaseSuccess: false }

  const currentVersion = parseInt(localStorage.getItem(KEY_SYNC_VERSION) || '0', 10)
  const newVersion = currentVersion + 1

  const syncData: CloudSyncData = {
    settings: data.settings,
    stats: data.stats,
    game: data.game,
    syncedAt: Date.now(),
    version: newVersion,
  }

  const nasSuccess = await syncToNas(syncData, auth)
  const supabaseSuccess = await syncToSupabase(syncData, auth)

  const success = nasSuccess || supabaseSuccess

  if (success) {
    localStorage.setItem(KEY_LAST_SYNC, Date.now().toString())
    localStorage.setItem(KEY_SYNC_VERSION, newVersion.toString())
  }

  return { success, nasSuccess, supabaseSuccess }
}

export const syncFromCloud = async (): Promise<CloudSyncData | null> => {
  const auth = getStoredAuth()
  if (!auth) return null

  const nasData = await syncFromNas(auth)
  const supabaseData = await syncFromSupabase(auth)

  if (!nasData && !supabaseData) return null
  if (!nasData) return supabaseData
  if (!supabaseData) return nasData

  return nasData.version >= supabaseData.version ? nasData : supabaseData
}

export const getLastSyncAt = (): number | null => {
  const ts = localStorage.getItem(KEY_LAST_SYNC)
  return ts ? parseInt(ts, 10) : null
}

import type { CloudSyncAuth, CloudSyncData, GameSnapshot, Settings, Stats } from './types'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const KEY_CLOUD_AUTH = 'sudoku.cloudAuth.v1'
const KEY_LAST_SYNC = 'sudoku.lastSync.v1'
const KEY_SYNC_VERSION = 'sudoku.syncVersion.v1'

let supabaseClient: SupabaseClient | null = null

let envVars: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string } = {}

try {
  if (typeof window !== 'undefined') {
    const metaUrl = document.querySelector('meta[name="supabase-url"]') as HTMLMetaElement
    const metaKey = document.querySelector('meta[name="supabase-key"]') as HTMLMetaElement
    if (metaUrl?.content) envVars.SUPABASE_URL = metaUrl.content
    if (metaKey?.content) envVars.SUPABASE_ANON_KEY = metaKey.content
    if (envVars.SUPABASE_URL && envVars.SUPABASE_ANON_KEY) {
      supabaseClient = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_ANON_KEY)
    }
  }
} catch {
  console.warn('Failed to read Supabase env config from meta tags')
}

export const setEnvConfig = (config: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string }) => {
  envVars = { ...envVars, ...config }
  if (envVars.SUPABASE_URL && envVars.SUPABASE_ANON_KEY) {
    supabaseClient = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_ANON_KEY)
  }
}

export const isSupabaseConfigured = (): boolean => {
  return !!(envVars.SUPABASE_URL && envVars.SUPABASE_ANON_KEY)
}

export const isCloudConfigured = (): boolean => {
  return isSupabaseConfigured()
}

export const getStoredAuth = (): CloudSyncAuth | null => {
  const data = localStorage.getItem(KEY_CLOUD_AUTH)
  if (!data) return null
  try {
    return JSON.parse(data) as CloudSyncAuth
  } catch {
    return null
  }
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

const syncToSupabase = async (data: CloudSyncData, auth: CloudSyncAuth): Promise<boolean> => {
  if (!supabaseClient) return false

  const userId = generateUserId(auth)

  try {
    const { error } = await supabaseClient
      .from('sudoku_save')
      .upsert({
        id: userId,
        nickname: auth.nickname,
        pin: auth.pin,
        data: data,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

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
}): Promise<{ success: boolean }> => {
  const auth = getStoredAuth()
  if (!auth) return { success: false }

  const currentVersion = parseInt(localStorage.getItem(KEY_SYNC_VERSION) || '0', 10)
  const newVersion = currentVersion + 1

  const syncData: CloudSyncData = {
    settings: data.settings,
    stats: data.stats,
    game: data.game,
    syncedAt: Date.now(),
    version: newVersion,
  }

  const supabaseSuccess = await syncToSupabase(syncData, auth)
  const success = supabaseSuccess

  if (success) {
    localStorage.setItem(KEY_LAST_SYNC, Date.now().toString())
    localStorage.setItem(KEY_SYNC_VERSION, newVersion.toString())
  }

  return { success }
}

export const syncFromCloud = async (): Promise<CloudSyncData | null> => {
  const auth = getStoredAuth()
  if (!auth) return null

  return syncFromSupabase(auth)
}

export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  if (!supabaseClient) return { success: false, error: 'Supabase 未配置' }
  try {
    const { error } = await supabaseClient.from('sudoku_save').select('id', { count: 'exact', head: true })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    return { success: false, error: '无法连接到服务器' }
  }
}

export const getCloudStatus = async (): Promise<{
  configured: boolean
  reachable: boolean
  error?: string
}> => {
  const configured = isSupabaseConfigured()
  if (!configured) return { configured: false, reachable: false }

  const result = await testSupabaseConnection()
  return { configured: true, reachable: result.success, error: result.error }
}

export const getLastSyncAt = (): number | null => {
  const ts = localStorage.getItem(KEY_LAST_SYNC)
  return ts ? parseInt(ts, 10) : null
}

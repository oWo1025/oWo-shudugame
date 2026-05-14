import type { CloudSyncAuth, CloudSyncData } from './types'

const KEY_LAST_SYNC = 'sudoku.lastSync.v1'
const KEY_SYNC_VERSION = 'sudoku.syncVersion.v1'

export type NasConfig = {
  serverUrl: string
  username: string
  password: string
  path: string
}

let nasEnvConfig: NasConfig | null = null

try {
  if (typeof window !== 'undefined') {
    const metaUrl = document.querySelector('meta[name="nas-url"]') as HTMLMetaElement
    const metaUser = document.querySelector('meta[name="nas-username"]') as HTMLMetaElement
    const metaPass = document.querySelector('meta[name="nas-password"]') as HTMLMetaElement
    const metaPath = document.querySelector('meta[name="nas-path"]') as HTMLMetaElement

    if (metaUrl?.content && metaUser?.content && metaPass?.content) {
      nasEnvConfig = {
        serverUrl: metaUrl.content,
        username: metaUser.content,
        password: metaPass.content,
        path: metaPath?.content || '/Sudoku',
      }
    }
  }
} catch {
  console.warn('Failed to read NAS env config from meta tags')
}

export const getNasConfig = (): NasConfig | null => nasEnvConfig

export const isNasConfigured = (): boolean => {
  return !!nasEnvConfig
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

export const syncToNas = async (data: CloudSyncData, auth: CloudSyncAuth): Promise<boolean> => {
  const config = nasEnvConfig
  if (!config) return false

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
      body: JSON.stringify(data),
    })

    if (!response.ok && response.status !== 201 && response.status !== 204) {
      console.error('NAS sync failed:', response.status, response.statusText)
      return false
    }

    localStorage.setItem(KEY_LAST_SYNC, Date.now().toString())
    localStorage.setItem(KEY_SYNC_VERSION, String(data.version))
    return true
  } catch (e) {
    console.error('NAS sync error:', e)
    return false
  }
}

export const syncFromNas = async (auth: CloudSyncAuth): Promise<CloudSyncData | null> => {
  const config = nasEnvConfig
  if (!config) return null

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
    localStorage.setItem(KEY_SYNC_VERSION, String(cloudData.version || 0))

    return cloudData
  } catch (e) {
    console.error('NAS fetch error:', e)
    return null
  }
}

export const testNasConnection = async (): Promise<{ success: boolean; error?: string }> => {
  const config = nasEnvConfig
  if (!config) return { success: false, error: '服务器N未配置' }

  const baseUrl = config.serverUrl.replace(/\/$/, '')
  const testUrl = `${baseUrl}/${config.path.replace(/^\//, '')}`

  try {
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

    if (response.status === 401 || response.status === 403) {
      return { success: false, error: '用户名或密码错误' }
    }

    if (response.status === 404) {
      return { success: false, error: `路径 ${config.path} 不存在，请在服务器N上创建此文件夹` }
    }

    return { success: false, error: `服务器返回 ${response.status}` }
  } catch (e) {
    const msg = e instanceof TypeError ? e.message : String(e)
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return {
        success: false,
        error: `无法访问`,
      }
    }
    return { success: false, error: `请求异常: ${msg}` }
  }
}

export const getLastSyncAt = (): number | null => {
  if (typeof window === 'undefined') return null
  const ts = localStorage.getItem(KEY_LAST_SYNC)
  return ts ? parseInt(ts, 10) : null
}

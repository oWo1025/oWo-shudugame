import { useState } from 'react'
import type { KeyboardSide, Mode, Settings, Theme, InputMode } from '../types'
import { Button, Segmented, Toggle } from '../ui'
import { playSound } from '../sound'
import { CloudSyncSetup } from './CloudSyncSetup'
import { isCloudConfigured, getStoredAuth, setStoredAuth, getLastSyncAt, getBackendStatus } from '../cloudSync'
import { hasPendingSync, retryNow } from '../syncQueue'

export const SettingsScreen = ({
  value,
  onChange,
  onBack,
  onResetAll,
  onChangelog,
  onSyncNow,
  onDisconnectCloud,
}: {
  value: Settings
  onChange: (next: Settings) => void
  onBack: () => void
  onResetAll: () => void
  onChangelog: () => void
  onSyncNow?: () => void
  onDisconnectCloud?: () => void
}) => {
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...value, [k]: v })

  const [showCloudSetup, setShowCloudSetup] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [backendStatus, setBackendStatus] = useState<{
    nasConfigured: boolean; nasReachable: boolean; nasError?: string
    supabaseConfigured: boolean; supabaseReachable: boolean; supabaseError?: string
  } | null>(null)
  const btnClick = () => playSound(value.sound, 'click')

  const cloudConfigured = isCloudConfigured()
  const hasAuth = !!getStoredAuth()
  const lastSyncAt = getLastSyncAt()

  const modeOptions: Array<{ value: Mode; label: string }> = [
    { value: 'system', label: '系统' },
    { value: 'light', label: '浅色' },
    { value: 'dark', label: '深色' },
  ]

  const themeOptions: Array<{ value: Theme; label: string; desc?: string }> = [
    { value: 'classic', label: '经典' },
    { value: 'sand', label: '沙' },
    { value: 'sage', label: '苔' },
    { value: 'slate', label: '岩' },
    { value: 'ocean', label: '海' },
    { value: 'forest', label: '林' },
    { value: 'sunset', label: '暮' },
    { value: 'highContrast', label: '高对比', desc: '色弱友好' },
  ]

  const inputOptions: Array<{ value: InputMode; label: string }> = [
    { value: 'cellFirst', label: '先格后数' },
    { value: 'numberFirst', label: '先数后格' },
  ]

  const sideOptions: Array<{ value: KeyboardSide; label: string }> = [
    { value: 'left', label: '左手' },
    { value: 'right', label: '右手' },
  ]

  const handleCloudToggle = (enabled: boolean) => {
    if (enabled && !cloudConfigured) {
      set('cloudSync', true)
      return
    }
    if (enabled && !hasAuth) {
      setShowCloudSetup(true)
      return
    }
    set('cloudSync', enabled)
  }

  const handleAuth = (nickname: string, pin: string) => {
    setStoredAuth({ nickname, pin })
    setShowCloudSetup(false)
    set('cloudSync', true)
  }

  const checkBackendStatus = async () => {
    setCheckingStatus(true)
    try {
      const status = await getBackendStatus()
      setBackendStatus(status)
    } catch {
      setBackendStatus(null)
    }
    setCheckingStatus(false)
  }

  const pendingSync = hasPendingSync()
  const statusDot = (reachable: boolean | undefined, configured: boolean | undefined) => {
    if (!configured) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>未配置</span>
    if (reachable === undefined) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>未检测</span>
    if (reachable) return <span style={{ color: '#22c55e', fontSize: 12 }}>● 正常</span>
    return <span style={{ color: '#ef4444', fontSize: 12 }}>● 不可达</span>
  }

  return (
    <div className="app">
      <div className="topbar">
        <Button onClick={() => { btnClick(); onBack() }}>返回</Button>
        <div className="title">设置</div>
        <div />
      </div>

      <div className="card">
        <div className="cardHeader">
          <span className="muted">显示</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Segmented
            options={modeOptions.map((o) => ({ value: o.value, label: o.label }))}
            value={value.mode}
            onChange={(v) => set('mode', v as Mode)}
          />
          <div className="themeGrid">
            {themeOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`themeBtn ${value.theme === o.value ? 'themeBtnActive' : ''}`}
                onClick={() => { btnClick(); set('theme', o.value) }}
              >
                <span className="themeBtnLabel">{o.label}</span>
                {o.desc && <span className="themeBtnDesc">{o.desc}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <span className="muted">输入</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Segmented
            options={inputOptions.map((o) => ({ value: o.value, label: o.label }))}
            value={value.inputMode}
            onChange={(v) => set('inputMode', v as InputMode)}
          />
          <Segmented
            options={sideOptions.map((o) => ({ value: o.value, label: o.label }))}
            value={value.keyboardSide}
            onChange={(v) => set('keyboardSide', v as KeyboardSide)}
          />
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <span className="muted">辅助</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Toggle label="震动反馈" value={value.vibration} onChange={(v) => set('vibration', v)} />
          <Toggle label="音效" value={value.sound} onChange={(v) => set('sound', v)} />
          <Toggle
            label="实时错误标红"
            value={value.realtimeErrors}
            onChange={(v) => set('realtimeErrors', v)}
          />
          <Toggle
            label="自动候选数"
            value={value.autoCandidates}
            onChange={(v) => set('autoCandidates', v)}
          />
          <Toggle
            label="云同步"
            value={value.cloudSync}
            onChange={handleCloudToggle}
          />

          {value.cloudSync && (
            <div style={{
              padding: '12px',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              background: 'var(--select)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {!cloudConfigured ? (
                <div style={{
                  fontSize: '13px',
                  color: '#856404',
                  textAlign: 'center',
                  padding: '8px',
                  background: '#fff3cd',
                  borderRadius: '6px',
                }}>
                  ⚠️ 云同步服务未配置，请联系开发者
                </div>
              ) : !hasAuth ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Button onClick={() => { btnClick(); setShowCloudSetup(true) }}>
                    设置同步身份
                  </Button>
                  <Button onClick={() => { btnClick(); checkBackendStatus() }} disabled={checkingStatus}>
                    {checkingStatus ? '检测中...' : '检测后端连接'}
                  </Button>
                  {backendStatus && (
                    <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4, padding: '8px', background: 'var(--bg)', borderRadius: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>局域网</span>
                        {statusDot(backendStatus.nasReachable, backendStatus.nasConfigured)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>云端</span>
                        {statusDot(backendStatus.supabaseReachable, backendStatus.supabaseConfigured)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                      ☁️ <span style={{ color: 'var(--fg)', fontWeight: '600' }}>{getStoredAuth()?.nickname}</span>
                    </span>
                    {lastSyncAt && (
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        同步: {new Date(lastSyncAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <Button onClick={() => { btnClick(); checkBackendStatus() }} disabled={checkingStatus}>
                    {checkingStatus ? '检测中...' : '检测后端连接'}
                  </Button>
                  {backendStatus && (
                    <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4, padding: '8px', background: 'var(--bg)', borderRadius: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>局域网</span>
                        {statusDot(backendStatus.nasReachable, backendStatus.nasConfigured)}
                      </div>
                      {backendStatus.nasError && (
                        <div style={{ color: '#ef4444', fontSize: 11, paddingLeft: 8, whiteSpace: 'pre-line' }}>{backendStatus.nasError}</div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>云端</span>
                        {statusDot(backendStatus.supabaseReachable, backendStatus.supabaseConfigured)}
                      </div>
                      {backendStatus.supabaseError && (
                        <div style={{ color: '#ef4444', fontSize: 11, paddingLeft: 8, whiteSpace: 'pre-line' }}>{backendStatus.supabaseError}</div>
                      )}
                    </div>
                  )}
                  {pendingSync && (
                    <div style={{
                      fontSize: 12,
                      color: '#856404',
                      padding: '6px 8px',
                      background: '#fff3cd',
                      borderRadius: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span>⏳ 有数据等待同步</span>
                      <button
                        type="button"
                        onClick={() => { btnClick(); retryNow() }}
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          border: 'none',
                          borderRadius: 4,
                          background: '#f0ad4e',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        立即重试
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button onClick={() => { btnClick(); onSyncNow?.() }} wide>
                      立即同步
                    </Button>
                    <Button onClick={() => { btnClick(); onDisconnectCloud?.() }} wide>
                      断开
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Button wide onClick={() => { btnClick(); onChangelog() }}>
        更新内容
      </Button>

      <Button wide onClick={() => { btnClick(); onResetAll() }}>
        本地数据重置
      </Button>

      {showCloudSetup && (
        <CloudSyncSetup
          isCloudConfigured={cloudConfigured}
          onAuth={handleAuth}
          onClose={() => setShowCloudSetup(false)}
        />
      )}
    </div>
  )
}

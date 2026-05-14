import { useState } from 'react'
import type { KeyboardSide, Mode, Settings, Theme, InputMode } from '../types'
import { Button, Segmented, Toggle } from '../ui'
import { playSound } from '../sound'
import { CloudSyncSetup } from './CloudSyncSetup'
import { isCloudConfigured, getStoredAuth, setStoredAuth, getLastSyncAt } from '../cloudSync'

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
                <Button onClick={() => { btnClick(); setShowCloudSetup(true) }}>
                  设置同步身份
                </Button>
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

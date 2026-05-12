import type { KeyboardSide, Mode, Settings, Theme, InputMode } from '../types'
import { Button, Segmented, Toggle } from '../ui'
import { playSound } from '../sound'

export const SettingsScreen = ({
  value,
  onChange,
  onBack,
  onResetAll,
}: {
  value: Settings
  onChange: (next: Settings) => void
  onBack: () => void
  onResetAll: () => void
}) => {
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => onChange({ ...value, [k]: v })

  const btnClick = () => playSound(value.sound, 'click')

  const modeOptions: Array<{ value: Mode; label: string }> = [
    { value: 'system', label: '系统' },
    { value: 'light', label: '浅色' },
    { value: 'dark', label: '深色' },
  ]

  const themeOptions: Array<{ value: Theme; label: string }> = [
    { value: 'classic', label: '经典' },
    { value: 'sand', label: '沙' },
    { value: 'sage', label: '苔' },
    { value: 'slate', label: '岩' },
  ]

  const inputOptions: Array<{ value: InputMode; label: string }> = [
    { value: 'cellFirst', label: '先格后数' },
    { value: 'numberFirst', label: '先数后格' },
  ]

  const sideOptions: Array<{ value: KeyboardSide; label: string }> = [
    { value: 'left', label: '左手' },
    { value: 'right', label: '右手' },
  ]

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
          <Segmented
            options={themeOptions.map((o) => ({ value: o.value, label: o.label }))}
            value={value.theme}
            onChange={(v) => set('theme', v as Theme)}
          />
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
          <Toggle label="云同步" value={value.cloudSync} onChange={(v) => set('cloudSync', v)} />
        </div>
      </div>

      <Button wide onClick={() => { btnClick(); onResetAll() }}>
        本地数据重置
      </Button>
    </div>
  )
}

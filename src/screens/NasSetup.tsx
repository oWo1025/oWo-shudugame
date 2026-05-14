import { useState } from 'react'
import { Button, Modal } from '../ui'

type Props = {
  onClose: () => void
  onAuth: (nickname: string, pin: string) => void
}

export const NasSetup = ({ onClose, onAuth }: Props) => {
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!nickname.trim()) {
      setError('请输入昵称')
      return
    }
    if (!pin.trim() || pin.trim().length < 3) {
      setError('PIN 码需要至少 3 位')
      return
    }
    onAuth(nickname.trim(), pin.trim())
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '280px', maxWidth: '420px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--fg)' }}>
            设置同步身份
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>
            输入昵称和 PIN 码来同步你的游戏数据
          </div>
        </div>

        <div style={{ background: '#e8f5e9', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#2e7d32', lineHeight: '1.5' }}>
          💡 同一组昵称 + PIN 码，在不同设备上登录即可同步进度。<br />
          不同玩家请使用不同的组合。
        </div>

        <div>
          <label style={{ fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
            昵称 *
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="例如：小明"
            maxLength={12}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              background: 'var(--input)',
              color: 'var(--fg)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
            PIN 码 *
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="至少3位数字"
            maxLength={8}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              background: 'var(--input)',
              color: 'var(--fg)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
            用于区分不同玩家
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--wrong)', fontSize: '13px', textAlign: 'center' }}>{error}</div>
        )}

        <Button onClick={handleSubmit} disabled={!nickname.trim() || !pin.trim()} wide>
          确认同步
        </Button>
      </div>
    </Modal>
  )
}

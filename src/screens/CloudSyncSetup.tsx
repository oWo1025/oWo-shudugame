import { useState } from 'react'
import { Button, Modal } from '../ui'

interface CloudSyncSetupProps {
  isCloudConfigured: boolean
  onAuth: (nickname: string, pin: string) => void
  onClose: () => void
}

export const CloudSyncSetup = ({ isCloudConfigured, onAuth, onClose }: CloudSyncSetupProps) => {
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')

  const handleSubmit = () => {
    if (!nickname.trim() || !pin.trim()) return
    onAuth(nickname.trim(), pin.trim())
  }

  return (
    <Modal onClose={onClose}>
      <div className="hintModalHeader">
        <span className="hintModalIcon">☁️</span>
        <span className="hintModalTitle">云同步</span>
      </div>
      
      <div className="hintModalDesc">
        设置您的游戏身份，数据将自动同步到云端
      </div>

      {!isCloudConfigured && (
        <div style={{
          padding: '12px',
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          color: '#856404',
          fontSize: '13px',
          marginTop: '12px',
          textAlign: 'center',
        }}>
          ⚠️ 云同步服务未配置，请联系开发者
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        <div>
          <label style={{ fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
            昵称 *
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="我的昵称"
            maxLength={20}
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
            placeholder="4-6位数字"
            maxLength={6}
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
            用于区分不同玩家，建议使用4-6位数字
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', textAlign: 'center' }}>
          * 必填项
        </div>

        <Button onClick={handleSubmit} disabled={!nickname.trim() || !pin.trim()} wide>
          开始同步
        </Button>
      </div>
    </Modal>
  )
}

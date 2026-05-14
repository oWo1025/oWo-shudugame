import { useState } from 'react'
import { Button, Modal } from '../ui'
import { setStoredNasConfig, testNasConnection, type NasConfig } from '../nasSync'
import { setStoredAuth } from '../cloudSync'

interface NasSetupProps {
  onClose: () => void
  onConfig: (config: NasConfig) => void
  onAuth?: (nickname: string, pin: string) => void
}

export const NasSetup = ({ onClose, onConfig, onAuth }: NasSetupProps) => {
  const [serverUrl, setServerUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [path, setPath] = useState('/Sudoku')
  const [nickname, setNickname] = useState('')
  const [pin, setPin] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)
  const [step, setStep] = useState<'config' | 'auth'>('config')

  const handleTest = async () => {
    if (!serverUrl || !username || !password) {
      setTestResult({ success: false, error: '请填写所有必填项' })
      return
    }

    setTesting(true)
    setTestResult(null)

    const config: NasConfig = { serverUrl, username, password, path }
    const result = await testNasConnection(config)

    setTesting(false)
    setTestResult(result)
  }

  const handleConfigNext = () => {
    if (!serverUrl || !username || !password) {
      setTestResult({ success: false, error: '请填写所有必填项' })
      return
    }
    setStep('auth')
  }

  const handleSave = () => {
    if (!nickname || !pin) {
      return
    }

    const config: NasConfig = { serverUrl, username, password, path }
    setStoredNasConfig(config)
    setStoredAuth({ nickname, pin })
    onConfig(config)
    onAuth?.(nickname, pin)
    onClose()
  }

  return (
    <Modal onClose={onClose}>
      <div className="hintModalHeader">
        <span className="hintModalIcon">🖥️</span>
        <span className="hintModalTitle">NAS 配置</span>
      </div>

      {step === 'config' && (
        <>
          <div className="hintModalDesc">配置您的 NAS 服务器以实现云同步</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                服务器地址 *
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://192.168.1.100:5006"
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
                用户名 *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
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
                密码 *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                同步路径
              </label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/Sudoku"
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
                数据将保存为 JSON 文件到指定路径
              </div>
            </div>

            {testResult && (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: testResult.success ? 'var(--success-bg, #d4edda)' : 'var(--error-bg, #f8d7da)',
                  color: testResult.success ? 'var(--success-fg, #155724)' : 'var(--error-fg, #721c24)',
                  fontSize: '13px',
                  textAlign: 'center',
                }}
              >
                {testResult.success ? '✓ 连接成功' : `✗ ${testResult.error}`}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Button onClick={() => handleTest()} disabled={testing}>
                {testing ? '测试中...' : '测试连接'}
              </Button>
              <Button onClick={() => handleConfigNext()}>
                下一步
              </Button>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px', textAlign: 'center' }}>
              * 表示必填项
            </div>
          </div>
        </>
      )}

      {step === 'auth' && (
        <>
          <div className="hintModalDesc">NAS 配置成功！现在设置您的玩家身份</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                昵称 *
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="我的昵称"
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
                placeholder="4位数字"
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

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Button onClick={() => setStep('config')}>
                上一步
              </Button>
              <Button onClick={() => handleSave()} disabled={!nickname || !pin}>
                完成设置
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}

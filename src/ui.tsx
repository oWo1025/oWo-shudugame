import { useEffect, useMemo, useState } from 'react'

export const Button = ({
  children,
  onClick,
  disabled,
  wide,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  wide?: boolean
}) => (
  <button
    type="button"
    className={`btn${wide ? ' btnWide' : ''}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
)

export const Toggle = ({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: boolean
  onChange: (v: boolean) => void
}) => (
  <button type="button" className="toggle" onClick={() => onChange(!value)}>
    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
      {label}
      {hint ? <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>{hint}</span> : null}
    </span>
    <span className="switch" data-on={value ? 'true' : 'false'}>
      <span className="switchKnob" />
    </span>
  </button>
)

export const Modal = ({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) => (
  <div className="modalOverlay" role="dialog" aria-modal="true" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
)

export const Segmented = ({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (v: string) => void
}) => (
  <div className="seg" role="tablist" aria-label="segmented">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        className="segBtn"
        data-active={o.value === value ? 'true' : 'false'}
        onClick={() => onChange(o.value)}
      >
        {o.label}
      </button>
    ))}
  </div>
)

export const ProgressBar = ({ value }: { value: number }) => {
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="bar" aria-hidden="true">
      <div className="barFill" style={{ width: `${v * 100}%` }} />
    </div>
  )
}

export const useToast = (ms = 1200) => {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    if (!text) return
    const t = window.setTimeout(() => setText(null), ms)
    return () => window.clearTimeout(t)
  }, [text, ms])
  const node = useMemo(
    () => (
      <div className="toast" data-show={text ? 'true' : 'false'} aria-live="polite">
        {text ?? ''}
      </div>
    ),
    [text],
  )
  return { toast: node, showToast: setText }
}


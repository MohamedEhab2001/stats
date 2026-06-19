import { useEffect } from 'react'
import { FireIcon, CloseIcon } from './Icons.jsx'

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDismiss, 6000)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      <div className={`toast-mark ${toast.player}`}><FireIcon size={18} /></div>
      <div className="toast-body">
        <div className="toast-title">
          New personal best{toast.records.length > 1 ? 's' : ''} · {toast.playerName}
        </div>
        <div className="toast-records">
          {toast.records.map(r => (
            <span key={r.key} className="toast-rec">
              {r.label} <strong>{r.value}</strong>
            </span>
          ))}
        </div>
      </div>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss"><CloseIcon size={14} /></button>
    </div>
  )
}

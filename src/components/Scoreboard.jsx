import { useRef, useState } from 'react'
import { STAT_DEFS } from '../lib/stats.js'
import { STAT_ICONS, TrophyIcon, CameraIcon } from './Icons.jsx'

export { STAT_DEFS } from '../lib/stats.js'

// Resize + center-crop a File to a 256×256 JPEG data URL
function fileToAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const SIZE = 256
        const canvas = document.createElement('canvas')
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext('2d')
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function PlayerCards({ record, latestWeek, form, streak, avatars, onSetAvatar }) {
  return (
    <div className="player-cards">
      <PlayerCard
        side="left"
        player="mohamed"
        name="Mohamed"
        jersey="M"
        jerseyClass="blue"
        record={record.mohamed}
        form={form.mohamed}
        streak={streak.mohamed}
        avatarUrl={avatars?.mohamed}
        onSetAvatar={(url) => onSetAvatar('mohamed', url)}
      />
      <div className="vs-divider">
        <div className="x">×</div>
        <div className="label">Week {latestWeek || '—'}</div>
      </div>
      <PlayerCard
        side="right"
        player="mohaned"
        name="Mohaned"
        jersey="M"
        jerseyClass="rose"
        record={record.mohaned}
        form={form.mohaned}
        streak={streak.mohaned}
        avatarUrl={avatars?.mohaned}
        onSetAvatar={(url) => onSetAvatar('mohaned', url)}
      />
    </div>
  )
}

function PlayerCard({ side, name, jersey, jerseyClass, record, form, streak, avatarUrl, onSetAvatar }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const gd = record.gf - record.ga
  const gdSign = gd > 0 ? '+' : ''
  const gdClass = gd > 0 ? 'pos' : gd < 0 ? 'neg' : 'neu'

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await fileToAvatar(file)
      onSetAvatar(dataUrl)
    } catch (err) {
      console.error('avatar processing failed', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <article className={`player-card ${side}`}>
      <div className="accent-corner" />
      <div className="pc-row">
        <div
          className={`avatar-wrap ${jerseyClass} ${uploading ? 'uploading' : ''}`}
          onClick={() => fileRef.current?.click()}
          title="Change photo"
        >
          {avatarUrl
            ? <img src={avatarUrl} alt={name} className="avatar-img" />
            : <span className="avatar-letter">{jersey}</span>
          }
          <div className="avatar-overlay">
            <CameraIcon size={15} />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="avatar-file-input"
            onChange={handleFile}
          />
        </div>
        <div className="info">
          <div className="name">{name}</div>
          <div className="tag">#{side === 'left' ? '01' : '02'}</div>
        </div>
      </div>

      <div className="record">
        <span className="chip win">{record.w}W</span>
        <span className="chip draw">{record.d}D</span>
        <span className="chip loss">{record.l}L</span>
        <span className={`chip gd ${gdClass}`} title="Goal difference">GD {gdSign}{gd}</span>
      </div>

      <div className="form-row">
        <span className="form-label">Form</span>
        <div className="form-pills">
          {form.length === 0 && <span className="form-empty">No matches yet</span>}
          {form.slice().reverse().map((r, i) => (
            <span key={i} className={`form-pill ${r.toLowerCase()}`}>{r}</span>
          ))}
        </div>
        {streak && streak.count >= 2 && (
          <span className={`streak ${streak.result.toLowerCase()}`}>
            {streak.count}{streak.result} streak
          </span>
        )}
      </div>
    </article>
  )
}

export function StatGrid({ totals, perStat }) {
  return (
    <div className="stat-grid">
      {STAT_DEFS.map(s => (
        <StatCard
          key={s.key}
          def={s}
          left={totals.mohamed[s.key]}
          right={totals.mohaned[s.key]}
          ps={perStat[s.key]}
        />
      ))}
    </div>
  )
}

function StatCard({ def, left, right, ps }) {
  const Icon = STAT_ICONS[def.key]
  const leftIsLead = def.higherIsBetter ? left > right : left < right
  const rightIsLead = def.higherIsBetter ? right > left : right < left
  const tied = left === right
  const total = left + right
  const leftPct = total === 0 ? 50 : (left / total) * 100
  const rightPct = total === 0 ? 50 : 100 - leftPct

  const leaderClass = leftIsLead ? 'lead-mohamed' : rightIsLead ? 'lead-mohaned' : ''
  const cardClass = `stat-card ${leaderClass} ${!def.higherIsBetter ? 'negative' : ''}`

  return (
    <div className={cardClass}>
      <div className="head">
        <div className="label">
          <div className="icon-pill"><Icon size={18} /></div>
          <span>{def.label}</span>
        </div>
        {tied ? (
          <span className="leader-pill tied">Tied</span>
        ) : (
          <span className="leader-pill">
            <TrophyIcon size={12} />
            {leftIsLead ? 'Mohamed' : 'Mohaned'} {def.higherIsBetter ? 'leads' : 'fewer'}
          </span>
        )}
      </div>

      <div className="compare">
        <span className={`num left ${leftIsLead ? '' : tied ? '' : 'dim'}`}>{left}</span>
        <div className="split-bar" aria-hidden>
          <div className="seg left" style={{ width: `${leftPct}%` }} />
          <div className="seg right" style={{ width: `${rightPct}%` }} />
          <div className="divider" style={{ left: `${leftPct}%` }} />
        </div>
        <span className={`num right ${rightIsLead ? '' : tied ? '' : 'dim'}`}>{right}</span>
      </div>

      {ps && (
        <div className="weekly-record">
          <span className="who left"><span className="dot left" /> {ps.mohamed}</span>
          <span className="vs-text">vs</span>
          <span className="who right">{ps.mohaned} <span className="dot right" /></span>
          {ps.ties > 0 && <span className="ties">{ps.ties} drawn</span>}
          <span className="footnote">weeks won</span>
        </div>
      )}
    </div>
  )
}

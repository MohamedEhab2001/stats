import { useEffect, useState } from 'react'
import { CloseIcon, DiceIcon, PlusIcon, InfoIcon } from './Icons.jsx'
import { BADGE_KEYS, BadgeIcon, randomBadgeKey } from '../lib/badges.js'
import { randomName } from '../lib/tournamentNames.js'
import { activeBlockingCustom, todayStr } from '../lib/tournaments.js'

export default function NewTournamentModal({ rows, matches, onClose, onCreate }) {
  const [closing, setClosing] = useState(false)
  const [name, setName] = useState(() => randomName())
  const [badgeKey, setBadgeKey] = useState(() => randomBadgeKey())
  const [startDate, setStartDate] = useState(() => todayStr())
  const [matchesRequired, setMatchesRequired] = useState(4)
  const [submitting, setSubmitting] = useState(false)

  const blocker = activeBlockingCustom(rows, matches)
  const disabled = !!blocker || submitting || !name.trim()

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') doClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const doClose = () => {
    setClosing(true)
    setTimeout(() => onClose(), 140)
  }

  const submit = async (e) => {
    e?.preventDefault?.()
    if (disabled) return
    setSubmitting(true)
    try {
      await onCreate({
        name: name.trim(),
        badge_key: badgeKey,
        start_date: startDate,
        matches_required: Number(matchesRequired)
      })
      doClose()
    } catch (err) {
      console.error(err)
      setSubmitting(false)
    }
  }

  return (
    <div className={`modal-back ${closing ? 'closing' : ''}`} onClick={doClose}>
      <div className={`modal new-tournament-modal ${closing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={doClose} aria-label="Close"><CloseIcon /></button>

        <div className="head">
          <div className="head-text">
            <h3>New custom tournament</h3>
            <div className="sub">Pick the window. The winner takes Boot, Vision, Skills, and the title medal.</div>
          </div>
        </div>

        {blocker && (
          <div className="banner-error" style={{ margin: '8px 0 16px' }}>
            <InfoIcon size={14} />
            <span>
              <strong>{blocker.data.name}</strong> is still active — finish or reveal it before starting a new custom tournament.
            </span>
          </div>
        )}

        <form className="new-tournament-form" onSubmit={submit}>
          <label className="nt-row">
            <span className="nt-label">Name</span>
            <div className="nt-name">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={48}
                placeholder="Crimson Howl"
              />
              <button type="button" className="nt-roll" onClick={() => setName(randomName())} title="Roll a random name">
                <DiceIcon /> Roll
              </button>
            </div>
          </label>

          <label className="nt-row">
            <span className="nt-label">Badge</span>
            <div className="badge-picker">
              {BADGE_KEYS.map(k => (
                <button
                  type="button"
                  key={k}
                  className={`badge-swatch ${badgeKey === k ? 'active' : ''}`}
                  onClick={() => setBadgeKey(k)}
                  aria-label={k}
                >
                  <BadgeIcon badgeKey={k} size={26} />
                </button>
              ))}
            </div>
          </label>

          <div className="nt-row nt-row-grid">
            <label>
              <span className="nt-label">Start date</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </label>
            <label>
              <span className="nt-label">Matches required</span>
              <div className="nt-matches">
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={matchesRequired}
                  onChange={e => setMatchesRequired(e.target.value)}
                />
                <span className="nt-matches-val">{matchesRequired}</span>
              </div>
            </label>
          </div>

          <div className="form-foot">
            <div className="meta">
              <BadgeIcon badgeKey={badgeKey} size={22} />
              <div>
                <div><strong>{name || 'Unnamed tournament'}</strong></div>
                <div className="sub">{matchesRequired} completed matches from {startDate}</div>
              </div>
            </div>
            <button className="submit" type="submit" disabled={disabled}>
              <PlusIcon size={14} /> {submitting ? 'Creating…' : 'Create tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

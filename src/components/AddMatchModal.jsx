import { useEffect, useMemo, useState } from 'react'
import { STAT_DEFS, STAT_MAX, EMPTY_STATS } from '../lib/stats.js'
import { isoWeek } from '../lib/date.js'
import { STAT_ICONS, CloseIcon, PlusIcon } from './Icons.jsx'
import Slider from './Slider.jsx'
import { DIFF_EMOJI, DIFF_LABEL } from '../lib/challenges.js'

export default function AddMatchModal({ mode, initial, onClose, onSubmit, activeChallenge }) {
  const isEdit = mode === 'edit'
  const initialLogged = initial?.loggedBy || []

  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10))
  const week = useMemo(() => isoWeek(date), [date])
  const [mohamed, setMohamed] = useState({ ...EMPTY_STATS(), ...(initial?.mohamed ?? {}) })
  const [mohaned, setMohaned] = useState({ ...EMPTY_STATS(), ...(initial?.mohaned ?? {}) })
  const [mohamedActive, setMohamedActive] = useState(isEdit ? initialLogged.includes('mohamed') : true)
  const [mohanedActive, setMohanedActive] = useState(isEdit ? initialLogged.includes('mohaned') : true)

  // Challenge completion state — pre-fill from existing match if editing
  const [chalMohamed, setChalMohamed] = useState(initial?.challengeResult?.completions?.mohamed ?? false)
  const [chalMohaned, setChalMohaned] = useState(initial?.challengeResult?.completions?.mohaned ?? false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const canSave = useMemo(() => mohamedActive || mohanedActive, [mohamedActive, mohanedActive])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSave) return
    const challengeResult = activeChallenge?.id
      ? {
          challenge_id: activeChallenge.id,
          points: activeChallenge.points,
          completions: { mohamed: chalMohamed, mohaned: chalMohaned }
        }
      : (initial?.challengeResult || null)
    const next = {
      id: initial?.id ?? `m-${Date.now()}`,
      week,
      date,
      mohamed: mohamedActive ? mohamed : (initial?.mohamed ?? EMPTY_STATS()),
      mohaned: mohanedActive ? mohaned : (initial?.mohaned ?? EMPTY_STATS()),
      loggedBy: dedupe([
        ...initialLogged,
        ...(mohamedActive ? ['mohamed'] : []),
        ...(mohanedActive ? ['mohaned'] : [])
      ]),
      challengeResult
    }
    onSubmit(next)
  }

  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form className="modal" onSubmit={handleSubmit}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <CloseIcon size={16} />
        </button>
        <h3>{isEdit ? 'Edit match' : 'Log this week'}</h3>
        <div className="sub">
          {isEdit
            ? 'Update either side’s stats and save.'
            : 'Drag the sliders. Toggle off a side if only one player is logging.'}
        </div>

        <div className="form-grid">
          <PlayerForm
            side="left"
            heading="Mohamed"
            jerseyClass="blue"
            values={mohamed}
            active={mohamedActive}
            onToggle={() => setMohamedActive(v => !v)}
            onChange={(k, v) => setMohamed(prev => ({ ...prev, [k]: v }))}
            wasLogged={initialLogged.includes('mohamed')}
            isEdit={isEdit}
          />
          <PlayerForm
            side="right"
            heading="Mohaned"
            jerseyClass="rose"
            values={mohaned}
            active={mohanedActive}
            onToggle={() => setMohanedActive(v => !v)}
            onChange={(k, v) => setMohaned(prev => ({ ...prev, [k]: v }))}
            wasLogged={initialLogged.includes('mohaned')}
            isEdit={isEdit}
          />
        </div>

        {activeChallenge && (
          <div className="match-challenge-section">
            <div className="mcs-header">
              <span className={`mcs-diff-badge diff-${activeChallenge.difficulty}`}>
                {DIFF_EMOJI[activeChallenge.difficulty]} {DIFF_LABEL[activeChallenge.difficulty]} · +{activeChallenge.points} pts
              </span>
              <span className="mcs-label">⚡ This week's challenge</span>
            </div>
            <div className="mcs-title">{activeChallenge.title}</div>
            <div className="mcs-desc">{activeChallenge.description}</div>
            <div className="mcs-checks">
              <label className="mcs-check">
                <input
                  type="checkbox"
                  checked={chalMohamed}
                  onChange={e => setChalMohamed(e.target.checked)}
                  disabled={!mohamedActive}
                />
                <span className={`jersey blue`} />
                <span>Mohamed completed it</span>
              </label>
              <label className="mcs-check">
                <input
                  type="checkbox"
                  checked={chalMohaned}
                  onChange={e => setChalMohaned(e.target.checked)}
                  disabled={!mohanedActive}
                />
                <span className={`jersey rose`} />
                <span>Mohaned completed it</span>
              </label>
            </div>
          </div>
        )}

        <div className="form-foot">
          <div className="meta">
            <div className="meta-field">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="meta-field">
              <label>Week</label>
              <div className="meta-readonly">W{week}</div>
            </div>
          </div>
          <button type="submit" className="submit" disabled={!canSave}>
            <PlusIcon size={14} />
            {submitLabel(isEdit, mohamedActive, mohanedActive)}
          </button>
        </div>
      </form>
    </div>
  )
}

function submitLabel(isEdit, mLeft, mRight) {
  if (!mLeft && !mRight) return 'Pick a side'
  const verb = isEdit ? 'Update' : 'Save'
  if (mLeft && mRight) return `${verb} match`
  if (mLeft) return `${verb} Mohamed`
  return `${verb} Mohaned`
}

function PlayerForm({ side, heading, jerseyClass, values, active, onToggle, onChange, wasLogged, isEdit }) {
  return (
    <div className={`form-side ${side} ${active ? '' : 'inactive'}`}>
      <div className="head">
        <div className={`jersey ${jerseyClass}`}>{heading[0]}</div>
        <div className="head-text">
          <h4>{heading}</h4>
          {isEdit && wasLogged && <span className="logged-tag">Already logged</span>}
        </div>
        <button type="button" className={`toggle ${active ? 'on' : 'off'}`} onClick={onToggle} aria-pressed={active}>
          <span className="toggle-dot" />
          <span className="toggle-label">{active ? 'Submitting' : 'Skip'}</span>
        </button>
      </div>

      <div className="sliders">
        {STAT_DEFS.map(s => {
          const Icon = STAT_ICONS[s.key]
          return (
            <div className="slider-row" key={s.key}>
              <div className="slider-label">
                <span className="ic"><Icon size={13} /></span>
                <span className="lbl">{s.label}</span>
                <span className="val">{values[s.key]}</span>
              </div>
              <Slider
                value={values[s.key]}
                onChange={(v) => onChange(s.key, v)}
                max={STAT_MAX[s.key]}
                side={side}
                disabled={!active}
                ariaLabel={`${heading} ${s.label}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function dedupe(arr) {
  return Array.from(new Set(arr))
}

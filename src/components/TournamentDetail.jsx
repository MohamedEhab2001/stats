import { useEffect, useMemo, useRef, useState } from 'react'
import { CloseIcon, CalendarIcon, TrophyIcon, PencilIcon, TrashIcon } from './Icons.jsx'
import LeagueLogo from './LeagueLogo.jsx'
import LeagueTable from './LeagueTable.jsx'
import PrizeCard from './PrizeCard.jsx'
import { updateTournamentField } from '../lib/api.js'
import { LEAGUES, LEAGUE_CATEGORIES, leagueLogoUrl } from '../lib/leagues.js'
import {
  tournamentStatus, filterMatchesForTournament, monthLabel,
  PRIZE_KEYS, PRIZE_KEYS_MONTHLY, computeChallengeBonuses
} from '../lib/tournaments.js'
import { isComplete } from '../lib/stats.js'
import { computeMOTM } from '../lib/motm.js'

export default function TournamentDetail({ row, matches, onClose, onReveal, revealing, onDelete }) {
  const [closing, setClosing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // League logo picker
  const [showPicker, setShowPicker] = useState(false)
  const [editLeagueId, setEditLeagueId] = useState(null)
  const [leagueCat, setLeagueCat] = useState('all')
  const [savingLogo, setSavingLogo] = useState(false)

  // Name editor
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)
  const nameInputRef = useRef(null)

  useEffect(() => {
    if (row) {
      setEditLeagueId(row.data?.league_id || null)
      setNameValue(row.data?.name || '')
    }
  }, [row?.key])

  useEffect(() => {
    if (editingName) nameInputRef.current?.select()
  }, [editingName])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showPicker) { setShowPicker(false); return }
        if (editingName) { cancelNameEdit(); return }
        doClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showPicker, editingName])

  // ── Prize reveal animation ──────────────────────────────────────────────
  const [revealCount, setRevealCount] = useState(() => {
    const pKeys = row?.data?.kind === 'monthly' ? PRIZE_KEYS_MONTHLY : PRIZE_KEYS
    return row?.data?.revealed ? pKeys.length : 0
  })
  const revealIntervalRef = useRef(null)
  // Tracks whether this tournament was already revealed when we opened it
  const wasAlreadyRevealedRef = useRef(!!row?.data?.revealed)

  useEffect(() => {
    wasAlreadyRevealedRef.current = !!row?.data?.revealed
    clearInterval(revealIntervalRef.current)
    const pKeys = row?.data?.kind === 'monthly' ? PRIZE_KEYS_MONTHLY : PRIZE_KEYS
    setRevealCount(row?.data?.revealed ? pKeys.length : 0)
  }, [row?.key])

  useEffect(() => {
    if (!row?.data?.revealed || wasAlreadyRevealedRef.current) return
    wasAlreadyRevealedRef.current = true
    const pKeys = row?.data?.kind === 'monthly' ? PRIZE_KEYS_MONTHLY : PRIZE_KEYS
    setRevealCount(0)
    let count = 0
    clearInterval(revealIntervalRef.current)
    revealIntervalRef.current = setInterval(() => {
      count++
      setRevealCount(count)
      if (count >= pKeys.length) clearInterval(revealIntervalRef.current)
    }, 650)
  }, [row?.data?.revealed])

  useEffect(() => () => clearInterval(revealIntervalRef.current), [])
  // ────────────────────────────────────────────────────────────────────────

  const doClose = () => {
    setClosing(true)
    setTimeout(() => onClose(), 140)
  }

  const filteredLeagues = useMemo(
    () => leagueCat === 'all' ? LEAGUES : LEAGUES.filter(l => l.category === leagueCat),
    [leagueCat]
  )

  // --- Logo ---
  const saveLeague = async () => {
    setSavingLogo(true)
    try {
      await updateTournamentField(row.key, { league_id: editLeagueId })
      setShowPicker(false)
    } catch (e) {
      console.error('update league failed', e)
    } finally {
      setSavingLogo(false)
    }
  }

  const cancelPicker = () => {
    setEditLeagueId(row.data?.league_id || null)
    setShowPicker(false)
  }

  // --- Name ---
  const startNameEdit = () => {
    setNameValue(row.data?.name || '')
    setEditingName(true)
  }

  const cancelNameEdit = () => {
    setNameValue(row.data?.name || '')
    setEditingName(false)
  }

  const saveName = async () => {
    const trimmed = nameValue.trim()
    if (!trimmed || trimmed === row.data?.name) { setEditingName(false); return }
    setSavingName(true)
    try {
      await updateTournamentField(row.key, { name: trimmed })
      setEditingName(false)
    } catch (e) {
      console.error('update name failed', e)
    } finally {
      setSavingName(false)
    }
  }

  const handleNameKey = (e) => {
    if (e.key === 'Enter') saveName()
  }

  if (!row) return null
  const data = row.data
  const status = tournamentStatus(row, matches)
  const eligible = filterMatchesForTournament(row, matches)
  const prizeKeys = data.kind === 'monthly' ? PRIZE_KEYS_MONTHLY : PRIZE_KEYS

  const windowLabel = data.kind === 'monthly'
    ? monthLabel(data.month_key)
    : data.kind === 'yearly'
      ? `Jan 1 – Dec 31, ${data.year}`
      : `From ${data.start_date} · ${data.matches_required} matches`

  const showReveal = status === 'finished' && !data.revealed

  return (
    <div className={`modal-back ${closing ? 'closing' : ''}`} onClick={doClose}>
      <div className={`modal tournament-modal ${closing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header-actions">
          {data.kind === 'custom' && onDelete && (
            confirmDelete ? (
              <div className="td-delete-confirm-inline">
                <span>Delete?</span>
                <button className="td-delete-cancel" onClick={() => setConfirmDelete(false)}>No</button>
                <button className="td-delete-confirm-btn" onClick={() => { onDelete(row.key); doClose() }}>Yes, delete</button>
              </div>
            ) : (
              <button className="td-trash-btn" onClick={() => setConfirmDelete(true)} title="Delete tournament">
                <TrashIcon size={14} />
              </button>
            )
          )}
          <button className="modal-close" onClick={doClose} aria-label="Close"><CloseIcon /></button>
        </div>

        <div className="tournament-hero">
          <button
            type="button"
            className={`hero-badge kind-${data.kind} hero-badge-btn`}
            onClick={() => { setShowPicker(p => !p); setEditingName(false) }}
            title="Change league logo"
          >
            <LeagueLogo leagueId={data.league_id} badgeKey={data.badge_key} size={56} />
            <span className="hero-badge-edit-hint">{showPicker ? 'Cancel' : 'Edit'}</span>
          </button>

          <div className="hero-text">
            <div className="hero-kind">{kindLabel(data.kind)}</div>

            {editingName ? (
              <div className="hero-name-edit">
                <input
                  ref={nameInputRef}
                  className="hero-name-input"
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onKeyDown={handleNameKey}
                  maxLength={48}
                  disabled={savingName}
                />
                <div className="hero-name-actions">
                  <button type="button" className="hna-cancel" onClick={cancelNameEdit} disabled={savingName}>Cancel</button>
                  <button type="button" className="hna-save" onClick={saveName} disabled={savingName || !nameValue.trim()}>
                    {savingName ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="hero-name-row">
                <h3 className="hero-name">{data.name}</h3>
                <button type="button" className="hero-name-edit-btn" onClick={startNameEdit} title="Edit name">
                  <PencilIcon size={13} />
                </button>
              </div>
            )}

            <div className="hero-meta">
              <span><CalendarIcon size={12} /> {windowLabel}</span>
              <span className={`status-pill ${status}`}>{statusBadge(status, data)}</span>
            </div>
          </div>
        </div>

        {showPicker && (
          <div className="hero-league-picker">
            <div className="hlp-head">
              <span className="nt-label">League logo</span>
              {editLeagueId && (
                <button type="button" className="league-clear" onClick={() => setEditLeagueId(null)}>
                  × Clear
                </button>
              )}
            </div>
            <div className="league-cat-strip">
              {LEAGUE_CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  className={`league-cat-btn ${leagueCat === cat.key ? 'active' : ''}`}
                  onClick={() => setLeagueCat(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="league-picker">
              {filteredLeagues.map(l => (
                <button
                  key={l.id}
                  type="button"
                  className={`league-swatch ${editLeagueId === l.id ? 'active' : ''}`}
                  onClick={() => setEditLeagueId(editLeagueId === l.id ? null : l.id)}
                  title={l.name}
                >
                  <img src={leagueLogoUrl(l.id)} alt="" width={28} height={28} style={{ objectFit: 'contain' }} />
                  <span>{l.name}</span>
                </button>
              ))}
            </div>
            <div className="hlp-foot">
              <button type="button" className="hlp-cancel" onClick={cancelPicker}>Cancel</button>
              <button type="button" className="hlp-save" onClick={saveLeague} disabled={savingLogo}>
                {savingLogo ? 'Saving…' : 'Save logo'}
              </button>
            </div>
          </div>
        )}

        {showReveal && (
          <div className="reveal-band">
            <div className="reveal-text">
              <strong>{eligible.length} matches counted.</strong>
              <span>This tournament is finished — reveal the winners.</span>
            </div>
            <button className="reveal-btn" disabled={revealing} onClick={() => onReveal(row.key)}>
              <TrophyIcon size={14} /> {revealing ? 'Revealing…' : 'Reveal results'}
            </button>
          </div>
        )}

        <div className="td-section">
          <div className="td-section-head"><h4>League table</h4><span className="sub">All-stat standings across the window</span></div>
          <LeagueTable matches={eligible} bonuses={computeChallengeBonuses(eligible)} />
        </div>

        {data.revealed && (
          <>
            <div className="td-section">
              <div className="td-section-head">
                <h4>Prizes</h4>
                <span className="sub">Final results</span>
              </div>
              <div className="prize-grid">
                {prizeKeys.slice(0, revealCount).map(k => (
                  <div key={k} className="prize-reveal-wrap">
                    <PrizeCard
                      prizeKey={k}
                      kind={data.kind === 'monthly' ? 'monthly' : 'other'}
                      matches={eligible}
                      revealed={true}
                      result={data.results?.prizes?.[k]}
                      leagueId={data.league_id}
                    />
                  </div>
                ))}
              </div>
            </div>
            {revealCount >= prizeKeys.length && (
              <MOTMHistory matches={eligible} />
            )}
          </>
        )}

        <div className="td-section">
          <div className="td-section-head"><h4>Matches in this window</h4><span className="sub">{eligible.length} {eligible.length === 1 ? 'match' : 'matches'}</span></div>
          {eligible.length === 0 ? (
            <div className="empty">No matches logged in this window yet.</div>
          ) : (
            <ul className="td-match-list">
              {eligible.slice().reverse().map(m => (
                <li key={m.id}>
                  <span className="td-week">W{m.week}</span>
                  <span className="td-date">{m.date}</span>
                  <span className="td-score">
                    <strong>{m.mohamed.goals}</strong> – <strong>{m.mohaned.goals}</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}

const MOTM_NAME = { mohamed: 'Mohamed', mohaned: 'Mohaned', tie: 'Draw' }

function MOTMHistory({ matches }) {
  const complete = matches
    .filter(m => isComplete(m))
    .map(m => ({ ...m, motm: computeMOTM(m) }))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  if (complete.length === 0) return null

  const countM = complete.filter(m => m.motm.winner === 'mohamed').length
  const countN = complete.filter(m => m.motm.winner === 'mohaned').length
  const countT = complete.filter(m => m.motm.winner === 'tie').length

  const summary = countM === countN
    ? `${countM} each${countT ? ` · ${countT} shared` : ''}`
    : countM > countN
      ? `Mohamed leads ${countM}–${countN}${countT ? ` · ${countT} shared` : ''}`
      : `Mohaned leads ${countN}–${countM}${countT ? ` · ${countT} shared` : ''}`

  return (
    <div className="td-section motm-hist-section">
      <div className="td-section-head">
        <h4>Man of the Match</h4>
        <span className="sub">{summary}</span>
      </div>
      <div className="motm-hist-list">
        {complete.map((m, i) => {
          const w = m.motm.winner
          const isTie = w === 'tie'
          return (
            <div
              key={m.id}
              className={`motm-hist-row ${isTie ? 'motm-hist-tie' : `motm-hist-${w}`}`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="motm-hist-meta">
                <span className="motm-hist-week">W{m.week}</span>
                <span className="motm-hist-score">
                  {m.mohamed.goals}–{m.mohaned.goals}
                </span>
              </div>
              <div className="motm-hist-badge">
                <span className={`motm-hist-jersey ${isTie ? 'motm-hist-jersey-tie' : `motm-hist-jersey-${w}`}`}>
                  {isTie ? '½' : MOTM_NAME[w][0]}
                </span>
                <span className="motm-hist-name">{MOTM_NAME[w]}</span>
              </div>
              <div className="motm-hist-reason">{m.motm.reasons[0]}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function kindLabel(k) {
  if (k === 'monthly') return 'Monthly tournament'
  if (k === 'yearly') return 'Yearly season'
  return 'Custom tournament'
}
function statusBadge(s, data) {
  if (s === 'finished') return data.revealed ? 'Revealed' : 'Awaiting reveal'
  if (s === 'live') return 'Live'
  if (s === 'upcoming') return 'Upcoming'
  return s
}

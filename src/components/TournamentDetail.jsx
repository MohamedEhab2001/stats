import { useEffect, useState } from 'react'
import { CloseIcon, CalendarIcon, TrophyIcon } from './Icons.jsx'
import { BadgeIcon } from '../lib/badges.js'
import LeagueTable from './LeagueTable.jsx'
import PrizeCard from './PrizeCard.jsx'
import {
  tournamentStatus, filterMatchesForTournament, monthLabel,
  PRIZE_KEYS, PRIZE_KEYS_MONTHLY
} from '../lib/tournaments.js'

export default function TournamentDetail({ row, matches, onClose, onReveal, revealing }) {
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') doClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const doClose = () => {
    setClosing(true)
    setTimeout(() => onClose(), 140)
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
        <button className="modal-close" onClick={doClose} aria-label="Close"><CloseIcon /></button>

        <div className="tournament-hero">
          <div className={`hero-badge kind-${data.kind}`}><BadgeIcon badgeKey={data.badge_key} size={56} /></div>
          <div className="hero-text">
            <div className="hero-kind">{kindLabel(data.kind)}</div>
            <h3 className="hero-name">{data.name}</h3>
            <div className="hero-meta">
              <span><CalendarIcon size={12} /> {windowLabel}</span>
              <span className={`status-pill ${status}`}>{statusBadge(status, data)}</span>
            </div>
          </div>
        </div>

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
          <LeagueTable matches={eligible} />
        </div>

        <div className="td-section">
          <div className="td-section-head">
            <h4>Prizes</h4>
            <span className="sub">{data.revealed ? 'Final results' : 'Live leader · finalised on reveal'}</span>
          </div>
          <div className="prize-grid">
            {prizeKeys.map(k => (
              <PrizeCard
                key={k}
                prizeKey={k}
                kind={data.kind === 'monthly' ? 'monthly' : 'other'}
                matches={eligible}
                revealed={!!data.revealed}
                result={data.results?.prizes?.[k]}
              />
            ))}
          </div>
        </div>

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

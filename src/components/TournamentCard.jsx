import { BadgeIcon } from '../lib/badges.js'
import {
  tournamentStatus, filterMatchesForTournament, standings,
  progressFor, monthLabel
} from '../lib/tournaments.js'

const NAME = { mohamed: 'Mohamed', mohaned: 'Mohaned' }

export default function TournamentCard({ row, matches, onOpen }) {
  const data = row.data
  const status = tournamentStatus(row, matches)
  const eligible = filterMatchesForTournament(row, matches)
  const t = standings(eligible)
  const progress = progressFor(row, matches)

  let leaderText = '—'
  if (eligible.length) {
    if (data.revealed && data.results?.prizes?.winner?.winners) {
      const w = data.results.prizes.winner.winners
      leaderText = w.length === 2 ? 'Shared title' : `${NAME[w[0]]} won`
    } else if (t.mohamed.wins > t.mohaned.wins) leaderText = `${NAME.mohamed} leads`
    else if (t.mohaned.wins > t.mohamed.wins) leaderText = `${NAME.mohaned} leads`
    else if (t.mohamed.pIndex > t.mohaned.pIndex) leaderText = `${NAME.mohamed} ahead on P`
    else if (t.mohaned.pIndex > t.mohamed.pIndex) leaderText = `${NAME.mohaned} ahead on P`
    else leaderText = 'Level'
  }

  const subtitle = data.kind === 'monthly'
    ? monthLabel(data.month_key)
    : data.kind === 'yearly'
      ? `Year ${data.year}`
      : `Custom · from ${data.start_date}`

  const fillPct = progress.total ? Math.min(100, Math.round((progress.current / progress.total) * 100))
    : eligible.length ? Math.min(100, eligible.length * 10) : 4

  return (
    <button type="button" className={`tournament-card status-${status} kind-${data.kind} ${data.revealed ? 'revealed' : ''}`} onClick={() => onOpen(row.key)}>
      <div className="tc-head">
        <div className="tc-badge"><BadgeIcon badgeKey={data.badge_key} size={36} /></div>
        <div className="tc-text">
          <div className="tc-name">{data.name}</div>
          <div className="tc-sub">{subtitle}</div>
        </div>
        <span className={`status-pill ${status}`}>{statusLabel(status, data)}</span>
      </div>
      <div className="tc-progress">
        <div className="tc-progress-bar"><span style={{ width: `${fillPct}%` }} /></div>
        <div className="tc-progress-meta">
          <span>{progress.label}</span>
          <span>{leaderText}</span>
        </div>
      </div>
    </button>
  )
}

function statusLabel(status, data) {
  if (status === 'finished') return data.revealed ? 'Revealed' : 'Ready to reveal'
  if (status === 'live') return 'Live'
  if (status === 'upcoming') return 'Upcoming'
  return status
}

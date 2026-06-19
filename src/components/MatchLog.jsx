import { STAT_DEFS, isComplete, matchMVP, performanceIndex } from '../lib/stats.js'
import { STAT_ICONS, TrashIcon, CalendarIcon, TrophyIcon, PlusIcon, MedalIcon } from './Icons.jsx'

function PencilIcon({ size = 14 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
    </svg>
  )
}

export default function MatchLog({ matches, onDelete, onEdit, onAddSide }) {
  if (!matches.length) {
    return (
      <div className="empty">
        <div className="ic"><CalendarIcon size={28} /></div>
        <strong>No matches yet</strong>
        Log your first week to start tracking the rivalry.
      </div>
    )
  }

  return (
    <div className="matches">
      {matches.map(m => (
        <MatchCard
          key={m.id}
          match={m}
          onDelete={onDelete}
          onEdit={onEdit}
          onAddSide={onAddSide}
        />
      ))}
    </div>
  )
}

function MatchCard({ match, onDelete, onEdit, onAddSide }) {
  const logged = match.loggedBy || ['mohamed', 'mohaned']
  const hasMohamed = logged.includes('mohamed')
  const hasMohaned = logged.includes('mohaned')
  const complete = isComplete(match)
  const mvp = complete ? matchMVP(match) : null
  const mhScore = hasMohamed ? performanceIndex(match.mohamed) : null
  const mnScore = hasMohaned ? performanceIndex(match.mohaned) : null

  let winnerTag
  if (!complete) {
    const who = !hasMohamed ? 'Mohamed' : 'Mohaned'
    winnerTag = <span className="winner-tag awaiting">Awaiting {who}</span>
  } else if (match.mohamed.goals > match.mohaned.goals) {
    winnerTag = <span className="winner-tag left"><TrophyIcon size={12} /> Mohamed won {match.mohamed.goals}–{match.mohaned.goals}</span>
  } else if (match.mohamed.goals < match.mohaned.goals) {
    winnerTag = <span className="winner-tag right"><TrophyIcon size={12} /> Mohaned won {match.mohaned.goals}–{match.mohamed.goals}</span>
  } else {
    winnerTag = <span className="winner-tag draw">Drawn {match.mohamed.goals}–{match.mohaned.goals}</span>
  }

  return (
    <article className={`match ${complete ? '' : 'partial'}`}>
      <div className="top">
        <div className="week-pill">
          <span className="week-num">Week {String(match.week).padStart(2, '0')}</span>
          <span className="date"><CalendarIcon size={13} /> {formatDate(match.date)}</span>
        </div>
        <div className="row-actions">
          {winnerTag}
          {mvp && mvp.player !== 'tie' && (
            <span className={`mvp-pill ${mvp.player === 'mohamed' ? 'left' : 'right'}`}>
              <MedalIcon size={12} /> MVP: {mvp.player === 'mohamed' ? 'Mohamed' : 'Mohaned'} · {mvp.score}
            </span>
          )}
          <button className="icon-btn" onClick={() => onEdit(match)} aria-label="Edit match">
            <PencilIcon size={13} /> Edit
          </button>
          <button
            className="icon-btn danger"
            onClick={() => { if (confirm('Delete this match?')) onDelete(match.id) }}
            aria-label="Delete match"
          >
            <TrashIcon size={13} /> Remove
          </button>
        </div>
      </div>

      <div className="grid">
        {hasMohamed
          ? <Side match={match} player="mohamed" side="left" score={mhScore} />
          : <AwaitingSide side="left" name="Mohamed" onAdd={() => onAddSide(match, 'mohamed')} />}
        <div className="center-divider" />
        {hasMohaned
          ? <Side match={match} player="mohaned" side="right" score={mnScore} />
          : <AwaitingSide side="right" name="Mohaned" onAdd={() => onAddSide(match, 'mohaned')} />}
      </div>
    </article>
  )
}

function Side({ match, player, side, score }) {
  return (
    <div className={`side-block ${side}`}>
      <div className="side-head">
        <span className="side-name">{player === 'mohamed' ? 'Mohamed' : 'Mohaned'}</span>
        {score !== null && (
          <span className="side-pindex">P-Index <strong>{score}</strong></span>
        )}
      </div>
      <div className={`match-side-light ${side}`}>
        {STAT_DEFS.map(s => {
          const Icon = STAT_ICONS[s.key]
          return (
            <div className="match-cell-light" key={s.key} title={s.label}>
              <span className="ic"><Icon size={13} /></span>
              <span className="v">{match[player][s.key]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AwaitingSide({ side, name, onAdd }) {
  return (
    <div className={`awaiting-side ${side}`}>
      <div className="awaiting-text">
        <strong>{name}</strong> hasn’t logged yet
      </div>
      <button type="button" className="awaiting-btn" onClick={onAdd}>
        <PlusIcon size={12} /> Add {name}’s stats
      </button>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T12:00:00')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

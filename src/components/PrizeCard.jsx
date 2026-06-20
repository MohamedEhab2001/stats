import { PRIZE_ICONS } from './Icons.jsx'
import { PRIZE_META, computePrizes, standings } from '../lib/tournaments.js'
import { leagueLogoUrl } from '../lib/leagues.js'

const NAME = { mohamed: 'Mohamed', mohaned: 'Mohaned' }

export default function PrizeCard({ prizeKey, kind, matches, revealed, result, leagueId }) {
  const meta = PRIZE_META[prizeKey]
  const Icon = PRIZE_ICONS[prizeKey]
  if (!meta) return null

  let info
  if (revealed && result) {
    info = result
  } else {
    const live = computePrizes(matches, kind)
    info = live[prizeKey]
  }

  const winners = info?.winners || []
  const isTie = winners.length === 2
  const lead = winners[0]
  const sideClass = isTie ? 'tie' : (lead ? `side-${lead}` : 'empty')

  const figure = (() => {
    if (!matches.length) return '—'
    if (prizeKey === 'winner') {
      const t = standings(matches)
      return isTie ? `${t.mohamed.wins}–${t.mohaned.wins}` : `${t[lead]?.wins ?? 0} wins`
    }
    if (prizeKey === 'playerOfMonth') {
      const t = standings(matches)
      return isTie ? `${Math.round(t.mohamed.pIndex)}–${Math.round(t.mohaned.pIndex)}` : `${Math.round(t[lead]?.pIndex ?? 0)} P`
    }
    const t = standings(matches)
    return isTie ? `${t.mohamed[meta.statKey]}–${t.mohaned[meta.statKey]}` : `${t[lead]?.[meta.statKey] ?? 0} ${meta.statLabel}`
  })()

  return (
    <div className={`prize-card ${sideClass} ${revealed ? 'revealed' : 'live'}`}>
      <div className="prize-head">
        <div className="prize-ic"><Icon size={16} /></div>
        <div className="prize-title">{meta.label}</div>
        {leagueId && (
          <img
            src={leagueLogoUrl(leagueId)}
            alt=""
            className="prize-league-logo"
            width={20}
            height={20}
          />
        )}
        {revealed && <div className="prize-stamp">Awarded</div>}
      </div>
      <div className="prize-leader">
        {!matches.length ? (
          <span className="prize-empty">No matches yet</span>
        ) : isTie ? (
          <>
            <span className="jersey blue" />
            <span className="prize-vs">+</span>
            <span className="jersey rose" />
            <span className="prize-name">Tied</span>
          </>
        ) : (
          <>
            <span className={`jersey ${lead === 'mohamed' ? 'blue' : 'rose'}`} />
            <span className="prize-name">{NAME[lead]}</span>
          </>
        )}
        <span className="prize-fig">{figure}</span>
      </div>
      {info?.why && <div className="prize-why">{info.why}</div>}
      {!revealed && <div className="prize-tag">{matches.length ? 'Live · current leader' : 'Awaiting matches'}</div>}
    </div>
  )
}

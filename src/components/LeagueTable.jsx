import { STAT_DEFS } from '../lib/stats.js'
import { standings } from '../lib/tournaments.js'

const COLS = [
  ...STAT_DEFS.map(s => ({ key: s.key, label: s.short, fullLabel: s.label })),
  { key: 'pIndex', label: 'P', fullLabel: 'P-Index', accent: true },
  { key: 'wins', label: 'W', fullLabel: 'Wins' },
  { key: 'draws', label: 'D', fullLabel: 'Draws' },
  { key: 'losses', label: 'L', fullLabel: 'Losses' }
]

// bonuses = { mohamed: number, mohaned: number } — challenge bonus points
export default function LeagueTable({ matches, bonuses }) {
  const t = standings(matches)
  const hasBonuses = bonuses && (bonuses.mohamed > 0 || bonuses.mohaned > 0)
  const players = ['mohamed', 'mohaned'].sort((a, b) => {
    if (t[b].pIndex !== t[a].pIndex) return t[b].pIndex - t[a].pIndex
    return t[b].wins - t[a].wins
  })
  return (
    <div className="league-wrap">
      <table className="league-table">
        <thead>
          <tr>
            <th className="league-rank">#</th>
            <th className="league-name">Player</th>
            {COLS.map(c => (
              <th key={c.key} className={c.accent ? 'accent' : ''} title={c.fullLabel}>{c.label}</th>
            ))}
            {hasBonuses && <th className="bonus-col" title="Challenge bonus points">⚡</th>}
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p} className={`row-${p}`}>
              <td className="league-rank">{i + 1}</td>
              <td className="league-name">
                <span className={`jersey ${p === 'mohamed' ? 'blue' : 'rose'}`} />
                <span>{p === 'mohamed' ? 'Mohamed' : 'Mohaned'}</span>
              </td>
              {COLS.map(c => {
                const a = t.mohamed[c.key] || 0
                const b = t.mohaned[c.key] || 0
                const mine = p === 'mohamed' ? a : b
                const lead = c.key === 'losses' ? mine < (p === 'mohamed' ? b : a) : mine > (p === 'mohamed' ? b : a)
                const tied = a === b
                const display = c.key === 'pIndex' ? Math.round(mine) : mine
                return (
                  <td key={c.key} className={[
                    c.accent ? 'accent' : '',
                    lead && !tied ? 'lead' : '',
                    tied ? 'tied' : ''
                  ].filter(Boolean).join(' ')}>{display}</td>
                )
              })}
              {hasBonuses && (
                <td className={`bonus-col ${bonuses[p] > 0 ? 'bonus-earned' : ''}`}>
                  {bonuses[p] > 0 ? `+${bonuses[p]}` : '–'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

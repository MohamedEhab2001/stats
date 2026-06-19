import { STAT_DEFS } from '../lib/stats.js'
import { standings } from '../lib/tournaments.js'

const COLS = [
  ...STAT_DEFS.map(s => ({ key: s.key, label: s.short, fullLabel: s.label })),
  { key: 'pIndex', label: 'P', fullLabel: 'P-Index', accent: true },
  { key: 'wins', label: 'W', fullLabel: 'Wins' },
  { key: 'draws', label: 'D', fullLabel: 'Draws' },
  { key: 'losses', label: 'L', fullLabel: 'Losses' }
]

export default function LeagueTable({ matches }) {
  const t = standings(matches)
  return (
    <div className="league-wrap">
      <table className="league-table">
        <thead>
          <tr>
            <th className="league-name">Player</th>
            {COLS.map(c => (
              <th key={c.key} className={c.accent ? 'accent' : ''} title={c.fullLabel}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {['mohamed','mohaned'].map(p => (
            <tr key={p} className={`row-${p}`}>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import { useState } from 'react'
import { PRIZE_ICONS } from './Icons.jsx'
import { BadgeIcon } from '../lib/badges.js'
import { PRIZE_META, PRIZE_KEYS_MONTHLY, trophyCabinet } from '../lib/tournaments.js'

const NAME = { mohamed: 'Mohamed', mohaned: 'Mohaned' }

export default function TrophyCabinet({ rows }) {
  const cab = trophyCabinet(rows)
  const [openMedal, setOpenMedal] = useState(null) // { player, prize }

  return (
    <div className="cabinet-grid">
      {['mohamed','mohaned'].map(p => (
        <div key={p} className={`cabinet-player side-${p}`}>
          <div className="cabinet-head">
            <span className={`jersey ${p === 'mohamed' ? 'blue' : 'rose'}`} />
            <strong>{NAME[p]}</strong>
            <span className="cabinet-total">{totalMedals(cab[p])} medals</span>
          </div>
          <div className="cabinet-row">
            {PRIZE_KEYS_MONTHLY.map(k => {
              const Icon = PRIZE_ICONS[k]
              const list = cab[p][k] || []
              const isOpen = openMedal && openMedal.player === p && openMedal.prize === k
              return (
                <div key={k} className={`cabinet-medal ${list.length ? 'has' : 'empty'} ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="cabinet-medal-btn"
                    onClick={() => setOpenMedal(isOpen ? null : { player: p, prize: k })}
                    disabled={!list.length}
                    title={PRIZE_META[k].label}
                  >
                    <span className="medal-ic"><Icon size={18} /></span>
                    <span className="medal-count">{list.length}</span>
                    <span className="medal-label">{PRIZE_META[k].short}</span>
                  </button>
                  {isOpen && list.length > 0 && (
                    <div className="medal-pop">
                      <div className="medal-pop-head">{PRIZE_META[k].label}</div>
                      <ul>
                        {list.map(src => (
                          <li key={src.key}>
                            <span className="medal-pop-badge"><BadgeIcon badgeKey={src.badge} size={16} /></span>
                            <span>{src.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function totalMedals(byPrize) {
  return Object.values(byPrize).reduce((s, arr) => s + arr.length, 0)
}

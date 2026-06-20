import { useState } from 'react'
import LeagueLogo from './LeagueLogo.jsx'
import { leagueLogoUrl } from '../lib/leagues.js'
import { PRIZE_META, PRIZE_KEYS_MONTHLY, trophyCabinet } from '../lib/tournaments.js'

const NAME = { mohamed: 'Mohamed', mohaned: 'Mohaned' }

// Visual identity per prize — emoji + unique palette
const PRIZE_VISUAL = {
  goldenBoot:    { emoji: '🥾', bg: 'linear-gradient(160deg,#fef9c3,#fde68a)', border: '#d97706', glow: 'rgba(217,119,6,0.28)',   label: '#92400e' },
  goldenVision:  { emoji: '👁️', bg: 'linear-gradient(160deg,#dbeafe,#bfdbfe)', border: '#3b82f6', glow: 'rgba(59,130,246,0.22)',  label: '#1e40af' },
  goldenSkills:  { emoji: '⚡', bg: 'linear-gradient(160deg,#fef3c7,#fbbf24)', border: '#f59e0b', glow: 'rgba(245,158,11,0.28)',  label: '#92400e' },
  winner:        { emoji: '🏆', bg: 'linear-gradient(160deg,#fef3c7,#fed7aa)', border: '#ea580c', glow: 'rgba(234,88,12,0.28)',   label: '#7c2d12' },
  playerOfMonth: { emoji: '⭐', bg: 'linear-gradient(160deg,#ede9fe,#c4b5fd)', border: '#8b5cf6', glow: 'rgba(139,92,246,0.28)', label: '#4c1d95' },
}

export default function TrophyCabinet({ rows }) {
  const cab = trophyCabinet(rows)
  const [openMedal, setOpenMedal] = useState(null) // { player, prize }

  return (
    <div className="cabinet-grid">
      {['mohamed', 'mohaned'].map(p => (
        <div key={p} className={`cabinet-player side-${p}`}>
          <div className="cabinet-head">
            <span className={`jersey ${p === 'mohamed' ? 'blue' : 'rose'}`} />
            <strong>{NAME[p]}</strong>
            <span className="cabinet-total">{totalMedals(cab[p])} medals</span>
          </div>
          <div className="cabinet-row">
            {PRIZE_KEYS_MONTHLY.map(k => {
              const list = cab[p][k] || []
              const vis = PRIZE_VISUAL[k]
              const isOpen = openMedal?.player === p && openMedal?.prize === k
              // Most recent win's league logo shown as pip
              const lastWin = list[list.length - 1]

              return (
                <div key={k} className={`cabinet-medal ${list.length ? 'has' : 'empty'} ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="cabinet-medal-btn"
                    style={list.length ? {
                      background: vis.bg,
                      borderColor: vis.border,
                      boxShadow: `0 4px 16px ${vis.glow}`,
                    } : {}}
                    onClick={() => setOpenMedal(isOpen ? null : { player: p, prize: k })}
                    disabled={!list.length}
                    title={PRIZE_META[k].label}
                  >
                    {list.length > 0 && (
                      <span className="medal-count-badge">{list.length}</span>
                    )}
                    <div className="medal-award-wrap">
                      <span className="medal-emoji" role="img">{vis.emoji}</span>
                      {lastWin?.leagueId && (
                        <img
                          src={leagueLogoUrl(lastWin.leagueId)}
                          alt=""
                          className="medal-league-pip"
                          width={20}
                          height={20}
                        />
                      )}
                    </div>
                    <span className="medal-label" style={list.length ? { color: vis.label } : {}}>
                      {PRIZE_META[k].short}
                    </span>
                  </button>

                  {isOpen && list.length > 0 && (
                    <div className="medal-pop">
                      <div className="medal-pop-head">
                        <span className="medal-pop-emoji">{vis.emoji}</span>
                        {PRIZE_META[k].label}
                      </div>
                      <ul>
                        {list.map(src => (
                          <li key={src.key}>
                            <span className="medal-pop-logo">
                              <LeagueLogo leagueId={src.leagueId} badgeKey={src.badge} size={28} />
                            </span>
                            <div className="medal-pop-info">
                              <span className="medal-pop-name">{src.name}</span>
                              <span className="medal-pop-kind">{kindLabel(src.kind)}</span>
                            </div>
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

function kindLabel(k) {
  if (k === 'monthly') return 'Monthly'
  if (k === 'yearly') return 'Yearly'
  return 'Custom'
}

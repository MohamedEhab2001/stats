import { useEffect, useState } from 'react'
import { computeMOTM } from '../lib/motm.js'

const PLAYER_NAME = { mohamed: 'Mohamed', mohaned: 'Mohaned' }
const ANALYZING_CATS = [
  'Goal contribution', 'Shot accuracy', 'Creativity',
  'Defensive work', 'Match result', 'Overall impact'
]

export default function MOTMRevealModal({ match, onClose, avatars }) {
  const [phase, setPhase] = useState('analyzing') // analyzing | revealed
  const [motm] = useState(() => computeMOTM(match))

  useEffect(() => {
    const t = setTimeout(() => setPhase('revealed'), 2000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase !== 'revealed') return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, onClose])

  const { winner, reasons } = motm
  const isTie = winner === 'tie'
  const winnerName = isTie ? null : PLAYER_NAME[winner]

  const score = `${match.mohamed.goals} – ${match.mohaned.goals}`

  return (
    <div
      className="motm-back"
      onClick={phase === 'revealed' ? onClose : undefined}
    >
      <div
        className={`motm-card motm-phase-${phase}`}
        onClick={e => e.stopPropagation()}
      >
        {phase === 'analyzing' ? (
          <div className="motm-analyzing">
            <div className="motm-ball-spin">⚽</div>
            <div className="motm-analyzing-title">Analysing performance…</div>
            <div className="motm-analyzing-cats">
              {ANALYZING_CATS.map((cat, i) => (
                <div
                  key={cat}
                  className="motm-cat-row"
                  style={{ animationDelay: `${i * 0.22}s` }}
                >
                  <span className="motm-cat-label">{cat}</span>
                  <div className="motm-cat-track">
                    <div
                      className="motm-cat-fill"
                      style={{ animationDelay: `${i * 0.22 + 0.08}s` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`motm-reveal ${isTie ? 'is-tie' : `is-${winner}`}`}>
            <div className="motm-broadcast-label">Man of the Match</div>

            <div className="motm-jersey-wrap">
              {isTie ? (
                <div className="motm-tie-row">
                  <div className="motm-jersey motm-jersey-mohamed">
                    {avatars?.mohamed
                      ? <img src={avatars.mohamed} alt="Mohamed" className="motm-jersey-img" />
                      : 'M'}
                  </div>
                  <span className="motm-tie-x">×</span>
                  <div className="motm-jersey motm-jersey-mohaned">
                    {avatars?.mohaned
                      ? <img src={avatars.mohaned} alt="Mohaned" className="motm-jersey-img" />
                      : 'M'}
                  </div>
                </div>
              ) : (
                <div className={`motm-jersey motm-jersey-${winner}`}>
                  {avatars?.[winner]
                    ? <img src={avatars[winner]} alt={winnerName} className="motm-jersey-img" />
                    : winnerName[0]}
                </div>
              )}
            </div>

            <div className="motm-winner-name">
              {isTie ? 'Shared Award' : winnerName}
            </div>

            <div className="motm-match-score">{score}</div>

            <ul className="motm-reasons">
              {reasons.map((r, i) => (
                <li
                  key={i}
                  className="motm-reason"
                  style={{ animationDelay: `${0.1 + i * 0.22}s` }}
                >
                  <span className="motm-reason-star">✦</span>
                  {r}
                </li>
              ))}
            </ul>

            <button className="motm-close-btn" onClick={onClose}>
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

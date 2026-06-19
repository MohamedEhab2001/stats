import { useState } from 'react'
import { STAT_DEFS } from '../lib/stats.js'
import { STAT_ICONS, ChevronIcon, ZapIcon, TrophyIcon, FireIcon, MedalIcon, InfoIcon } from './Icons.jsx'

export default function Explainer() {
  const [open, setOpen] = useState(null)

  return (
    <div className="explainer">
      <div className="explainer-rule">
        <div className="rule-head">
          <div className="rule-ic"><ZapIcon size={14} /></div>
          <strong>Performance Index</strong>
        </div>
        <p>
          Each match gets a single number — your <strong>P-Index</strong> — calculated from your stats and their weights.
          Highest P-Index in a complete week wins <strong>MVP</strong>, and the chart on this page tracks it over time.
        </p>
        <div className="formula">
          P = Goals×3 + Assists×2 + Shots on target + Dribbles + Possession won − Shots off target×0.5
        </div>
      </div>

      <div className="achievements-row">
        <div className="ach">
          <div className="ach-ic gold"><MedalIcon size={14} /></div>
          <div><strong>MVP of the Week</strong><span>Highest P-Index wins each complete match.</span></div>
        </div>
        <div className="ach">
          <div className="ach-ic fire"><FireIcon size={14} /></div>
          <div><strong>Personal Best</strong><span>Beat your own record in any stat — it pops on save.</span></div>
        </div>
        <div className="ach">
          <div className="ach-ic blue"><TrophyIcon size={14} /></div>
          <div><strong>Streak</strong><span>Win consecutive weeks to grow a streak badge.</span></div>
        </div>
      </div>

      <div className="accordion">
        {STAT_DEFS.map((s, i) => {
          const Icon = STAT_ICONS[s.key]
          const isOpen = open === s.key
          const weightLabel = s.weight === 0 ? 'No bonus' : s.weight > 0 ? `+${s.weight}× per point` : `${s.weight}× per point`
          return (
            <div className={`acc-row ${isOpen ? 'open' : ''}`} key={s.key}>
              <button type="button" className="acc-head" onClick={() => setOpen(isOpen ? null : s.key)}>
                <span className="acc-num">#{String(i + 1).padStart(2, '0')}</span>
                <span className="acc-ic"><Icon size={16} /></span>
                <span className="acc-name">{s.label}</span>
                <span className={`acc-weight ${weightClass(s.weight)}`}>{weightLabel}</span>
                <span className={`acc-arrow ${isOpen ? 'rot' : ''}`}><ChevronIcon size={14} /></span>
              </button>
              {isOpen && (
                <div className="acc-body">
                  <p>{s.blurb}</p>
                  <div className="acc-meta">
                    <span className={`pill ${s.higherIsBetter ? 'good' : 'bad'}`}>
                      <InfoIcon size={11} /> {s.higherIsBetter ? 'Higher is better' : 'Lower is better'}
                    </span>
                    <span className="pill plain">Max per week: {s.max}</span>
                    <span className="pill plain">Short code: {s.short}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function weightClass(w) {
  if (w >= 2) return 'high'
  if (w >= 1) return 'mid'
  if (w === 0) return 'zero'
  return 'neg'
}

import { useMemo, useState } from 'react'
import { scoutBoth, TIERS } from '../lib/scouting.js'
import { ZapIcon, TrendIcon, InfoIcon } from './Icons.jsx'

export default function ScoutingReport({ matches }) {
  const report = useMemo(() => scoutBoth(matches), [matches])
  return (
    <div className="scout-grid">
      <ScoutCard player="mohamed" name="Mohamed" jerseyClass="blue" data={report.mohamed} side="left" />
      <ScoutCard player="mohaned" name="Mohaned" jerseyClass="rose" data={report.mohaned} side="right" />
    </div>
  )
}

function ScoutCard({ player, name, jerseyClass, data, side }) {
  const [showAll, setShowAll] = useState(false)

  if (data.unscouted) {
    return (
      <article className={`scout-card ${side} unscouted`}>
        <div className="scout-head">
          <div className={`jersey ${jerseyClass}`}>M</div>
          <div className="info">
            <div className="name">{name}</div>
            <div className="tag">Scouting report</div>
          </div>
        </div>
        <div className="scout-empty">
          <InfoIcon size={14} />
          <span>Need {data.needed - data.played} more complete {data.needed - data.played === 1 ? 'match' : 'matches'} to scout.</span>
        </div>
      </article>
    )
  }

  const { score, tier, nextTier, formattedValue, drivers, mods, form } = data
  const tierSpan = tier.max - tier.min || 1
  const tierProgress = Math.max(0, Math.min(100, ((score - tier.min) / tierSpan) * 100))

  const driversShown = showAll ? drivers : drivers.slice(0, 4)
  const accent = tier.accent

  return (
    <article className={`scout-card ${side}`} style={{ '--tier-accent': accent }}>
      <div className="scout-head">
        <div className={`jersey ${jerseyClass}`}>M</div>
        <div className="info">
          <div className="name">{name}</div>
          <div className="tag">Scouting report · {data.played} matches</div>
        </div>
        <div className="scout-score">
          <div className="score-num">{Math.round(score)}</div>
          <div className="score-label">OVR</div>
        </div>
      </div>

      <div className="scout-tier">
        <div className="tier-row">
          <span className="tier-dot" style={{ background: accent }} />
          <div className="tier-text">
            <div className="tier-name">{tier.name}</div>
            <div className="tier-sub">{tier.sub}</div>
          </div>
        </div>
        <div className="tier-bar" aria-hidden>
          <div className="tier-bar-fill" style={{ width: `${tierProgress}%`, background: accent }} />
        </div>
        {nextTier ? (
          <div className="tier-next">
            {nextTier.scoreNeeded > 0
              ? <>+{nextTier.scoreNeeded.toFixed(1)} OVR to <strong>{nextTier.shortName}</strong></>
              : <>Knocking on <strong>{nextTier.shortName}</strong>'s door</>}
          </div>
        ) : (
          <div className="tier-next">Peak tier reached.</div>
        )}
      </div>

      <div className="scout-value">
        <div className="value-label">Market value</div>
        <div className="value-num">{formattedValue}</div>
      </div>

      {mods.length > 0 && (
        <div className="scout-mods">
          {mods.map((m, i) => (
            <span key={i} className={`mod-pill ${m.dir}`}>
              {m.dir === 'up' ? <TrendIcon size={11} /> : <TrendIcon size={11} style={{ transform: 'scaleY(-1)' }} />}
              {m.label} <em>{m.delta > 0 ? '+' : ''}{m.delta}%</em>
            </span>
          ))}
        </div>
      )}

      <div className="scout-drivers">
        <div className="drivers-head">
          <ZapIcon size={12} />
          <span>Top contributors</span>
        </div>
        <ul>
          {driversShown.map(d => (
            <li key={d.key}>
              <span className="d-label">{d.label}</span>
              <span className="d-value">{d.value}</span>
              <span className="d-points">+{d.points.toFixed(1)}</span>
            </li>
          ))}
        </ul>
        {drivers.length > 4 && (
          <button className="drivers-toggle" onClick={() => setShowAll(s => !s)}>
            {showAll ? 'Show fewer' : `Show ${drivers.length - 4} more`}
          </button>
        )}
      </div>

      {form.length > 0 && (
        <div className="scout-form">
          <span className="sf-label">Recent</span>
          <div className="sf-pills">
            {form.slice().reverse().map((r, i) => (
              <span key={i} className={`form-pill ${r.toLowerCase()}`}>{r}</span>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

export function TierLadder() {
  return (
    <div className="tier-ladder">
      {TIERS.map(t => (
        <div key={t.name} className="ladder-row">
          <span className="ladder-dot" style={{ background: t.accent }} />
          <span className="ladder-range">{t.min}–{t.max}</span>
          <span className="ladder-name">{t.name}</span>
          <span className="ladder-sub">{t.sub}</span>
        </div>
      ))}
    </div>
  )
}

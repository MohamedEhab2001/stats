import { useMemo } from 'react'
import { STAT_DEFS, performanceIndex, isComplete } from '../lib/stats.js'
import { STAT_ICONS, ZapIcon, TrophyIcon, MedalIcon, CalendarIcon } from './Icons.jsx'

export default function PIndexBoard({ matches }) {
  const data = useMemo(() => computeBoard(matches), [matches])
  const weeks = useMemo(() => computeWeeks(matches), [matches])

  if (!matches.length) {
    return (
      <div className="empty">
        <div className="ic"><ZapIcon size={28} /></div>
        <strong>No P-Index yet</strong>
        Log a week to see the scoreboard come to life.
      </div>
    )
  }

  const leader =
    data.mohamed.total > data.mohaned.total ? 'mohamed'
    : data.mohaned.total > data.mohamed.total ? 'mohaned'
    : 'tie'

  return (
    <div className="pindex-board">
      <div className="pindex-summary">
        <PlayerSummary
          side="left"
          jerseyClass="blue"
          name="Mohamed"
          data={data.mohamed}
          leadingWeeks={data.leads.mohamed}
          totalLed={data.leads.completedWeeks}
          isLeader={leader === 'mohamed'}
        />
        <PlayerSummary
          side="right"
          jerseyClass="rose"
          name="Mohaned"
          data={data.mohaned}
          leadingWeeks={data.leads.mohaned}
          totalLed={data.leads.completedWeeks}
          isLeader={leader === 'mohaned'}
        />
      </div>

      <div className="pindex-contrib">
        <div className="contrib-head">
          <h3>Where the points come from</h3>
          <span className="contrib-sub">Stat count × weight = points</span>
        </div>
        <div className="contrib-grid">
          <ContribCol name="Mohamed" side="left" rows={data.mohamed.contrib} total={data.mohamed.total} />
          <ContribCol name="Mohaned" side="right" rows={data.mohaned.contrib} total={data.mohaned.total} />
        </div>
      </div>

      <div className="pindex-ladder">
        <div className="contrib-head">
          <h3>Week-by-week</h3>
          <span className="contrib-sub">{weeks.length} {weeks.length === 1 ? 'week' : 'weeks'} · most recent first</span>
        </div>
        <div className="ladder">
          {weeks.map(row => <LadderRow key={row.week} row={row} />)}
        </div>
      </div>
    </div>
  )
}

function PlayerSummary({ side, jerseyClass, name, data, leadingWeeks, totalLed, isLeader }) {
  const avg = data.matches > 0 ? (data.total / data.matches).toFixed(1) : '0.0'
  return (
    <div className={`pindex-card ${side} ${isLeader ? 'leader' : ''}`}>
      <div className="pic-head">
        <div className={`jersey ${jerseyClass}`}>{name[0]}</div>
        <div className="pic-name-wrap">
          <div className="pic-name">{name}</div>
          <div className="pic-sub">{data.matches} {data.matches === 1 ? 'match' : 'matches'} logged</div>
        </div>
        {isLeader && (
          <span className="pic-crown">
            <TrophyIcon size={12} /> P-Index leader
          </span>
        )}
      </div>

      <div className="pic-total">
        <div className="pic-total-num">{data.total}</div>
        <div className="pic-total-lbl">Total P-Index</div>
      </div>

      <div className="pic-stats">
        <div className="pic-stat">
          <span className="pic-stat-lbl">Average</span>
          <span className="pic-stat-val">{avg}</span>
        </div>
        <div className="pic-stat">
          <span className="pic-stat-lbl">Best week</span>
          <span className="pic-stat-val">
            {data.best ? <>{data.best.score} <em>W{data.best.week}</em></> : '—'}
          </span>
        </div>
        <div className="pic-stat">
          <span className="pic-stat-lbl">Weeks led</span>
          <span className="pic-stat-val">
            {leadingWeeks}<em>/{totalLed}</em>
          </span>
        </div>
      </div>
    </div>
  )
}

function ContribCol({ name, side, rows, total }) {
  const maxAbs = Math.max(1, ...rows.map(r => Math.abs(r.points)))
  return (
    <div className={`contrib-col ${side}`}>
      <div className="contrib-col-head">
        <span className="contrib-col-name">{name}</span>
        <span className="contrib-col-total">
          <ZapIcon size={11} /> {total}
        </span>
      </div>
      <div className="contrib-rows">
        {rows.map(r => {
          const Icon = STAT_ICONS[r.key]
          const pct = (Math.abs(r.points) / maxAbs) * 100
          const isNeg = r.points < 0
          const isZero = r.weight === 0
          return (
            <div className={`contrib-row ${isNeg ? 'neg' : ''} ${isZero ? 'zero' : ''}`} key={r.key}>
              <div className="contrib-row-head">
                <span className="contrib-ic"><Icon size={13} /></span>
                <span className="contrib-lbl">{r.label}</span>
                <span className="contrib-math">
                  <span className="contrib-count">{r.count}</span>
                  <span className="contrib-x">×</span>
                  <span className={`contrib-w ${r.weight < 0 ? 'neg' : r.weight === 0 ? 'zero' : ''}`}>
                    {r.weight > 0 ? `+${r.weight}` : r.weight}
                  </span>
                </span>
                <span className={`contrib-pts ${isNeg ? 'neg' : ''}`}>
                  {r.points > 0 ? '+' : ''}{r.points}
                </span>
              </div>
              <div className="contrib-bar">
                <div className="contrib-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LadderRow({ row }) {
  const { week, date, mohamed, mohaned, winner, diff } = row
  const total = (mohamed ?? 0) + (mohaned ?? 0)
  const leftPct = total <= 0 ? 50 : ((mohamed ?? 0) / total) * 100
  const rightPct = total <= 0 ? 50 : 100 - leftPct

  return (
    <div className={`ladder-row ${winner ? `won-${winner}` : ''}`}>
      <div className="ladder-week">
        <span className="lw-num">W{String(week).padStart(2, '0')}</span>
        <span className="lw-date"><CalendarIcon size={11} /> {formatDate(date)}</span>
      </div>
      <div className="ladder-scores">
        <span className={`ladder-score left ${winner === 'mohamed' ? 'win' : ''}`}>
          {mohamed === null ? <em>—</em> : mohamed}
        </span>
        <div className="ladder-bar">
          <div className="ladder-seg left" style={{ width: `${leftPct}%` }} />
          <div className="ladder-seg right" style={{ width: `${rightPct}%` }} />
        </div>
        <span className={`ladder-score right ${winner === 'mohaned' ? 'win' : ''}`}>
          {mohaned === null ? <em>—</em> : mohaned}
        </span>
      </div>
      <div className="ladder-meta">
        {winner === 'tie' && <span className="ladder-tag tie">Tied</span>}
        {winner === 'mohamed' && (
          <span className="ladder-tag left">
            <MedalIcon size={11} /> Mohamed +{diff}
          </span>
        )}
        {winner === 'mohaned' && (
          <span className="ladder-tag right">
            <MedalIcon size={11} /> Mohaned +{diff}
          </span>
        )}
        {!winner && <span className="ladder-tag pending">Awaiting both</span>}
      </div>
    </div>
  )
}

function computeBoard(matches) {
  const computeFor = (player) => {
    const logged = matches.filter(m => (m.loggedBy || []).includes(player))
    let total = 0
    let best = null
    for (const m of logged) {
      const score = performanceIndex(m[player])
      total += score
      if (!best || score > best.score) best = { score, week: m.week, date: m.date }
    }
    const contrib = STAT_DEFS.map(s => {
      const count = logged.reduce((acc, m) => acc + (Number(m[player][s.key]) || 0), 0)
      return { key: s.key, label: s.label, count, weight: s.weight, points: count * s.weight }
    })
    return { total, matches: logged.length, best, contrib }
  }

  const leads = { mohamed: 0, mohaned: 0, ties: 0, completedWeeks: 0 }
  for (const m of matches) {
    if (!isComplete(m)) continue
    leads.completedWeeks++
    const mh = performanceIndex(m.mohamed)
    const mn = performanceIndex(m.mohaned)
    if (mh > mn) leads.mohamed++
    else if (mn > mh) leads.mohaned++
    else leads.ties++
  }

  return {
    mohamed: computeFor('mohamed'),
    mohaned: computeFor('mohaned'),
    leads
  }
}

function computeWeeks(matches) {
  return matches
    .slice()
    .sort((a, b) => b.week - a.week)
    .map(m => {
      const logged = m.loggedBy || []
      const mohamed = logged.includes('mohamed') ? performanceIndex(m.mohamed) : null
      const mohaned = logged.includes('mohaned') ? performanceIndex(m.mohaned) : null
      let winner = null
      let diff = 0
      if (mohamed !== null && mohaned !== null) {
        if (mohamed > mohaned) { winner = 'mohamed'; diff = mohamed - mohaned }
        else if (mohaned > mohamed) { winner = 'mohaned'; diff = mohaned - mohamed }
        else winner = 'tie'
      }
      return { week: m.week, date: m.date, mohamed, mohaned, winner, diff }
    })
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T12:00:00')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

import { useMemo, useState } from 'react'
import { STAT_DEFS, performanceIndex } from '../lib/stats.js'
import { STAT_ICONS, ZapIcon } from './Icons.jsx'

export default function TrendChart({ matches }) {
  const [activeKey, setActiveKey] = useState('pindex')
  const sorted = useMemo(() => [...matches].sort((a, b) => a.week - b.week), [matches])

  if (sorted.length === 0) return null

  const series = activeKey === 'pindex'
    ? {
        mohamed: sorted.map(m => performanceIndex(m.mohamed)),
        mohaned: sorted.map(m => performanceIndex(m.mohaned))
      }
    : {
        mohamed: sorted.map(m => m.mohamed[activeKey]),
        mohaned: sorted.map(m => m.mohaned[activeKey])
      }

  const weeks = sorted.map(m => m.week)
  const maxY = Math.max(1, ...series.mohamed, ...series.mohaned)

  return (
    <div className="trend-card">
      <div className="trend-tabs">
        <button
          className={`trend-tab pindex ${activeKey === 'pindex' ? 'active' : ''}`}
          onClick={() => setActiveKey('pindex')}
        >
          <ZapIcon size={14} />
          P-Index
        </button>
        {STAT_DEFS.map(s => {
          const Icon = STAT_ICONS[s.key]
          return (
            <button
              key={s.key}
              className={`trend-tab ${activeKey === s.key ? 'active' : ''}`}
              onClick={() => setActiveKey(s.key)}
            >
              <Icon size={14} />
              {s.label}
            </button>
          )
        })}
      </div>

      <div className="trend-legend">
        <span className="item"><span className="swatch" style={{ background: 'var(--mohamed)' }} /> Mohamed</span>
        <span className="item"><span className="swatch" style={{ background: 'var(--mohaned)' }} /> Mohaned</span>
        {activeKey === 'pindex' && (
          <span className="legend-note">P-Index combines all stats by weight</span>
        )}
      </div>

      <div className="chart-wrap">
        <Chart
          weeks={weeks}
          mohamed={series.mohamed}
          mohaned={series.mohaned}
          maxY={maxY}
        />
      </div>
    </div>
  )
}

function Chart({ weeks, mohamed, mohaned, maxY }) {
  const W = 800, H = 220
  const padL = 36, padR = 16, padT = 16, padB = 32
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const n = weeks.length

  const x = (i) => n === 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW
  const y = (v) => padT + innerH - (v / maxY) * innerH

  const linePath = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ')
  const areaPath = (arr) => `${linePath(arr)} L ${x(n - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`

  const yTicks = [0, Math.ceil(maxY / 2), maxY]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weekly trend">
      <defs>
        <linearGradient id="grad-blue" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="grad-rose" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL} x2={W - padR}
            y1={y(t)} y2={y(t)}
            stroke="#e6e9f0"
            strokeDasharray={i === 0 ? '0' : '3 4'}
          />
          <text x={padL - 8} y={y(t) + 4} fontSize="11" fill="#94a3b8" fontFamily="JetBrains Mono" textAnchor="end">{t}</text>
        </g>
      ))}

      {weeks.map((w, i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 10}
          fontSize="11"
          fill="#94a3b8"
          fontFamily="JetBrains Mono"
          textAnchor="middle"
        >W{w}</text>
      ))}

      <path d={areaPath(mohamed)} fill="url(#grad-blue)" />
      <path d={areaPath(mohaned)} fill="url(#grad-rose)" />

      <path d={linePath(mohamed)} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d={linePath(mohaned)} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {mohamed.map((v, i) => (
        <circle key={`mh-${i}`} cx={x(i)} cy={y(v)} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
      ))}
      {mohaned.map((v, i) => (
        <circle key={`mn-${i}`} cx={x(i)} cy={y(v)} r="4" fill="white" stroke="#f43f5e" strokeWidth="2" />
      ))}
    </svg>
  )
}

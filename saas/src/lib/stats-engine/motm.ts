// Generalized version of the old app's src/lib/motm.js. Man of the Match uses ratios/contextual
// bonuses (distinct from the P-Index weight system). For a week with exactly 2 loggers this is a
// direct port of the old math; for 3+ loggers, each entry is scored against the combined stats of
// everyone else who logged that week (its "field"), and the reasons compare the winner to the
// single highest-scoring runner-up.

import { statValue, type EntryStats, type Week } from './core'

function shotAcc(s: EntryStats) {
  const t = statValue(s, 'shotsOnTarget') + statValue(s, 'shotsOffTarget')
  return t > 0 ? statValue(s, 'shotsOnTarget') / t : 0
}

function sumOthers(entries: EntryStats[]): EntryStats {
  const out: EntryStats = {}
  for (const s of entries) {
    for (const [k, v] of Object.entries(s)) out[k] = (out[k] || 0) + (Number(v) || 0)
  }
  return out
}

function motmScore(s: EntryStats, opp: EntryStats): number {
  const acc = shotAcc(s)
  return (
    statValue(s, 'goals') * 5 +
    statValue(s, 'assists') * 3 +
    acc * 8 +
    statValue(s, 'dribbles') * 1.2 +
    statValue(s, 'possessionWon') * 1.4 +
    (statValue(opp, 'goals') === 0 ? 6 : 0) +
    (statValue(s, 'goals') > statValue(opp, 'goals') ? 5 : statValue(s, 'goals') === statValue(opp, 'goals') ? 1 : 0)
  )
}

function buildReasons(ws: EntryStats, os: EntryStats): string[] {
  const candidates: { priority: number; text: string }[] = []

  const hasGoalInvolv = statValue(ws, 'goals') > 0 || statValue(ws, 'assists') > 0
  if (hasGoalInvolv) {
    const parts: string[] = []
    const g = statValue(ws, 'goals')
    const a = statValue(ws, 'assists')
    if (g > 0) parts.push(`${g} goal${g !== 1 ? 's' : ''}`)
    if (a > 0) parts.push(`${a} assist${a !== 1 ? 's' : ''}`)
    candidates.push({ priority: 0, text: parts.join(' + ') })
  }

  const wAcc = shotAcc(ws)
  const oAcc = shotAcc(os)
  const wShots = statValue(ws, 'shotsOnTarget') + statValue(ws, 'shotsOffTarget')
  if (wShots >= 2 && wAcc > oAcc + 0.15) {
    candidates.push({ priority: 1, text: `${Math.round(wAcc * 100)}% shot accuracy — clinical in front of goal` })
  }

  const wDribbles = statValue(ws, 'dribbles')
  if (wDribbles >= 3 && wDribbles > statValue(os, 'dribbles')) {
    candidates.push({ priority: 2, text: `Dominated 1-v-1s with ${wDribbles} successful dribbles` })
  }

  const wPoss = statValue(ws, 'possessionWon')
  if (wPoss >= 5 && wPoss > statValue(os, 'possessionWon') + 2) {
    candidates.push({ priority: 3, text: `Won the midfield battle — ${wPoss} possession recoveries` })
  }

  if (statValue(os, 'goals') === 0) {
    candidates.push({
      priority: 4,
      text: statValue(ws, 'goals') > 0 ? 'Won to nil — a complete team performance' : 'Kept a clean sheet'
    })
  }

  if (statValue(ws, 'goals') > statValue(os, 'goals')) {
    candidates.push({ priority: 5, text: `Won ${statValue(ws, 'goals')}–${statValue(os, 'goals')}` })
  }

  if (candidates.length === 0) {
    candidates.push({ priority: 99, text: 'Outperformed across multiple stat categories' })
  }

  candidates.sort((a, b) => a.priority - b.priority)
  return candidates.slice(0, 3).map((c) => c.text)
}

export type MOTMResult = {
  winner: string | 'tie'
  scores: Record<string, number>
  reasons: string[]
}

export function computeMOTM(week: Week): MOTMResult | null {
  if (week.entries.length < 2) return null

  const scores: Record<string, number> = {}
  for (const entry of week.entries) {
    const others = week.entries.filter((e) => e.userId !== entry.userId).map((e) => e.stats)
    scores[entry.userId] = Math.round(motmScore(entry.stats, sumOthers(others)) * 10) / 10
  }

  const ranked = week.entries.map((e) => e.userId).sort((a, b) => scores[b] - scores[a])
  const top = ranked[0]
  const runnerUp = ranked[1]
  const gap = scores[top] - scores[runnerUp]

  if (Math.abs(gap) < 2) {
    return { winner: 'tie', scores, reasons: ['Equally matched — stats too close to separate'] }
  }

  const winnerEntry = week.entries.find((e) => e.userId === top)!
  const runnerUpEntry = week.entries.find((e) => e.userId === runnerUp)!
  return { winner: top, scores, reasons: buildReasons(winnerEntry.stats, runnerUpEntry.stats) }
}

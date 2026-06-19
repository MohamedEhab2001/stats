export const STAT_DEFS = [
  { key: 'goals',          label: 'Goals',           short: 'G',  max: 20, weight:  3, higherIsBetter: true,
    blurb: 'Times the ball went in the back of the net.' },
  { key: 'assists',        label: 'Assists',         short: 'A',  max: 20, weight:  2, higherIsBetter: true,
    blurb: 'Final pass that led directly to a teammate scoring.' },
  { key: 'shotsOnTarget',  label: 'Shots on target', short: 'ST', max: 40, weight:  1, higherIsBetter: true,
    blurb: 'Shots that forced a save or went in.' },
  { key: 'shotsOffTarget', label: 'Shots off target',short: 'SF', max: 40, weight: -0.5, higherIsBetter: false,
    blurb: 'Shots that missed the goal entirely. Counts toward your shot accuracy.' },
  { key: 'dribbles',       label: 'Dribbles',        short: 'DR', max: 50, weight:  1, higherIsBetter: true,
    blurb: 'Successful 1-v-1 take-ons past a defender.' },
  { key: 'possessionWon',  label: 'Possession won',  short: 'PW', max: 50, weight:  1, higherIsBetter: true,
    blurb: 'Tackles, interceptions, recoveries — getting the ball back.' }
]

export const STAT_MAX = Object.fromEntries(STAT_DEFS.map(s => [s.key, s.max]))

export const EMPTY_STATS = () => Object.fromEntries(STAT_DEFS.map(s => [s.key, 0]))

export function isComplete(match) {
  return (match.loggedBy || ['mohamed', 'mohaned']).length === 2
}

export function performanceIndex(side) {
  if (!side) return 0
  return STAT_DEFS.reduce((sum, s) => sum + (Number(side[s.key]) || 0) * s.weight, 0)
}

export function sumTotals(matches) {
  const t = { mohamed: EMPTY_STATS(), mohaned: EMPTY_STATS() }
  for (const m of matches) {
    const logged = m.loggedBy || ['mohamed', 'mohaned']
    if (logged.includes('mohamed')) {
      for (const s of STAT_DEFS) t.mohamed[s.key] += Number(m.mohamed[s.key]) || 0
    }
    if (logged.includes('mohaned')) {
      for (const s of STAT_DEFS) t.mohaned[s.key] += Number(m.mohaned[s.key]) || 0
    }
  }
  return t
}

export function computeRecord(matches) {
  const r = {
    mohamed: { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
    mohaned: { w: 0, d: 0, l: 0, gf: 0, ga: 0 }
  }
  for (const m of matches) {
    if (!isComplete(m)) continue
    const a = m.mohamed.goals
    const b = m.mohaned.goals
    r.mohamed.gf += a; r.mohamed.ga += b
    r.mohaned.gf += b; r.mohaned.ga += a
    if (a > b) { r.mohamed.w++; r.mohaned.l++ }
    else if (a < b) { r.mohaned.w++; r.mohamed.l++ }
    else { r.mohamed.d++; r.mohaned.d++ }
  }
  return r
}

export function computeForm(matches, player, limit = 5) {
  return matches
    .filter(isComplete)
    .slice()
    .sort((a, b) => b.week - a.week)
    .slice(0, limit)
    .map(m => {
      const mine = player === 'mohamed' ? m.mohamed.goals : m.mohaned.goals
      const theirs = player === 'mohamed' ? m.mohaned.goals : m.mohamed.goals
      if (mine > theirs) return 'W'
      if (mine < theirs) return 'L'
      return 'D'
    })
}

export function currentStreak(form) {
  if (!form.length) return { result: null, count: 0 }
  const first = form[0]
  let n = 1
  while (n < form.length && form[n] === first) n++
  return { result: first, count: n }
}

export function perStatRecord(matches) {
  const out = {}
  for (const s of STAT_DEFS) out[s.key] = { mohamed: 0, mohaned: 0, ties: 0 }
  for (const m of matches) {
    if (!isComplete(m)) continue
    for (const s of STAT_DEFS) {
      const a = m.mohamed[s.key]
      const b = m.mohaned[s.key]
      if (a === b) { out[s.key].ties++; continue }
      const aLeads = s.higherIsBetter ? a > b : a < b
      if (aLeads) out[s.key].mohamed++
      else out[s.key].mohaned++
    }
  }
  return out
}

export function matchMVP(match) {
  if (!isComplete(match)) return null
  const mh = performanceIndex(match.mohamed)
  const mn = performanceIndex(match.mohaned)
  if (mh > mn) return { player: 'mohamed', score: mh }
  if (mn > mh) return { player: 'mohaned', score: mn }
  return { player: 'tie', score: mh }
}

export function findBests(matches, player) {
  const bests = Object.fromEntries(STAT_DEFS.map(s => [s.key, 0]))
  for (const m of matches) {
    const logged = m.loggedBy || ['mohamed', 'mohaned']
    if (!logged.includes(player)) continue
    for (const s of STAT_DEFS) {
      const v = Number(m[player][s.key]) || 0
      if (s.higherIsBetter && v > bests[s.key]) bests[s.key] = v
    }
  }
  return bests
}

export function diffBests(before, after) {
  const broken = []
  for (const s of STAT_DEFS) {
    if (!s.higherIsBetter) continue
    if (after[s.key] > before[s.key] && after[s.key] > 0) {
      broken.push({ key: s.key, label: s.label, value: after[s.key] })
    }
  }
  return broken
}

import { STAT_DEFS, EMPTY_STATS, performanceIndex, isComplete } from './stats.js'

export const PRIZE_KEYS = ['goldenBoot', 'goldenVision', 'goldenSkills', 'winner']
export const PRIZE_KEYS_MONTHLY = [...PRIZE_KEYS, 'playerOfMonth']

export const PRIZE_META = {
  goldenBoot:    { label: 'Golden Boot',    short: 'Boot',    statKey: 'goals',    statLabel: 'goals' },
  goldenVision:  { label: 'Golden Vision',  short: 'Vision',  statKey: 'assists',  statLabel: 'assists' },
  goldenSkills:  { label: 'Golden Skills',  short: 'Skills',  statKey: 'dribbles', statLabel: 'dribbles' },
  winner:        { label: 'Tournament Winner', short: 'Winner', statKey: null,     statLabel: 'matches' },
  playerOfMonth: { label: 'Player of the Month', short: 'POTM', statKey: null,     statLabel: 'P-Index' }
}

const NAMES = { mohamed: 'Mohamed', mohaned: 'Mohaned' }

// ---------- Date helpers (timezone-safe; we only ever slice the yyyy-mm-dd string) ----------

export function monthKey(dateStr) {
  return (dateStr || '').slice(0, 7) // 'YYYY-MM'
}
export function yearKey(dateStr) {
  return (dateStr || '').slice(0, 4) // 'YYYY'
}
export function todayStr() {
  // local date in yyyy-mm-dd
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
export function monthLabel(mk) {
  // 'YYYY-MM' -> 'June 2026'
  if (!mk) return ''
  const [y, m] = mk.split('-').map(Number)
  const d = new Date(Date.UTC(y, (m || 1) - 1, 1))
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

// ---------- Window filtering ----------

export function filterMatchesForTournament(row, matches) {
  if (!row) return []
  const data = row.data
  const sorted = [...matches].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  if (data.kind === 'monthly') {
    return sorted.filter(m => monthKey(m.date) === data.month_key)
  }
  if (data.kind === 'yearly') {
    return sorted.filter(m => yearKey(m.date) === String(data.year))
  }
  if (data.kind === 'custom') {
    const onlyComplete = sorted
      .filter(m => isComplete(m))
      .filter(m => (m.date || '') >= (data.start_date || ''))
    return onlyComplete.slice(0, data.matches_required)
  }
  return []
}

// ---------- Status (derived) ----------

export function tournamentStatus(row, matches, today = todayStr()) {
  if (!row) return 'upcoming'
  const data = row.data
  if (data.kind === 'monthly') {
    return data.month_key < monthKey(today) ? 'finished' : 'live'
  }
  if (data.kind === 'yearly') {
    return String(data.year) < yearKey(today) ? 'finished' : 'live'
  }
  if (data.kind === 'custom') {
    if (today < (data.start_date || '')) return 'upcoming'
    const eligible = filterMatchesForTournament(row, matches)
    return eligible.length >= (data.matches_required || 0) ? 'finished' : 'live'
  }
  return 'live'
}

// ---------- Standings ----------

export function standings(matches) {
  const t = {
    mohamed: { ...EMPTY_STATS(), pIndex: 0, wins: 0, draws: 0, losses: 0, played: 0 },
    mohaned: { ...EMPTY_STATS(), pIndex: 0, wins: 0, draws: 0, losses: 0, played: 0 }
  }
  for (const m of matches) {
    const loggedM = (m.loggedBy || ['mohamed','mohaned']).includes('mohamed')
    const loggedN = (m.loggedBy || ['mohamed','mohaned']).includes('mohaned')
    if (loggedM) {
      for (const s of STAT_DEFS) t.mohamed[s.key] += Number(m.mohamed[s.key]) || 0
      t.mohamed.pIndex += performanceIndex(m.mohamed)
    }
    if (loggedN) {
      for (const s of STAT_DEFS) t.mohaned[s.key] += Number(m.mohaned[s.key]) || 0
      t.mohaned.pIndex += performanceIndex(m.mohaned)
    }
    if (!isComplete(m)) continue
    t.mohamed.played++; t.mohaned.played++
    const a = m.mohamed.goals, b = m.mohaned.goals
    if (a > b) { t.mohamed.wins++; t.mohaned.losses++ }
    else if (b > a) { t.mohaned.wins++; t.mohamed.losses++ }
    else { t.mohamed.draws++; t.mohaned.draws++ }
  }
  return t
}

// ---------- Tie-breaker pipeline ----------

function bestSingleMatch(matches, player, statKey) {
  let best = 0
  for (const m of matches) {
    const v = Number(m[player]?.[statKey]) || 0
    if (v > best) best = v
  }
  return best
}

function decideStat(matches, statKey) {
  // returns { winners: [...], totals: {a, b} }
  const totals = standings(matches)
  const a = totals.mohamed[statKey] || 0
  const b = totals.mohaned[statKey] || 0
  if (a !== b) return { winners: [a > b ? 'mohamed' : 'mohaned'], totals: { mohamed: a, mohaned: b } }
  // best single match of that stat
  const bsa = bestSingleMatch(matches, 'mohamed', statKey)
  const bsb = bestSingleMatch(matches, 'mohaned', statKey)
  if (bsa !== bsb) return { winners: [bsa > bsb ? 'mohamed' : 'mohaned'], totals: { mohamed: a, mohaned: b } }
  // most wins
  if (totals.mohamed.wins !== totals.mohaned.wins) {
    return { winners: [totals.mohamed.wins > totals.mohaned.wins ? 'mohamed' : 'mohaned'], totals: { mohamed: a, mohaned: b } }
  }
  // most played
  if (totals.mohamed.played !== totals.mohaned.played) {
    return { winners: [totals.mohamed.played > totals.mohaned.played ? 'mohamed' : 'mohaned'], totals: { mohamed: a, mohaned: b } }
  }
  return { winners: ['mohamed','mohaned'], totals: { mohamed: a, mohaned: b } }
}

function name(p) { return NAMES[p] }
function winnerOrTie(winners) {
  if (winners.length === 2) return 'Tied'
  return name(winners[0])
}

// ---------- Prize generators ----------

function prizeBoot(matches) {
  const r = decideStat(matches, 'goals')
  const why = r.winners.length === 2
    ? `Both finished tied on ${r.totals.mohamed} goals.`
    : `${name(r.winners[0])} scored ${r.totals[r.winners[0]]} goals; ${name(other(r.winners[0]))} scored ${r.totals[other(r.winners[0])]}.`
  return { winners: r.winners, why }
}
function prizeVision(matches) {
  const r = decideStat(matches, 'assists')
  const why = r.winners.length === 2
    ? `Both finished tied on ${r.totals.mohamed} assists.`
    : `${name(r.winners[0])} had ${r.totals[r.winners[0]]} assists; ${name(other(r.winners[0]))} had ${r.totals[other(r.winners[0])]}.`
  return { winners: r.winners, why }
}
function prizeSkills(matches) {
  const r = decideStat(matches, 'dribbles')
  const why = r.winners.length === 2
    ? `Both finished tied on ${r.totals.mohamed} dribbles.`
    : `${name(r.winners[0])} completed ${r.totals[r.winners[0]]} dribbles; ${name(other(r.winners[0]))} completed ${r.totals[other(r.winners[0])]}.`
  return { winners: r.winners, why }
}
function prizeWinner(matches) {
  const t = standings(matches)
  const a = t.mohamed.wins, b = t.mohaned.wins
  if (a === b) {
    // tie on wins -> goal difference, then played
    const gdA = t.mohamed.goals - t.mohaned.goals
    if (gdA !== 0) {
      const w = gdA > 0 ? 'mohamed' : 'mohaned'
      return { winners: [w], why: `${name(w)} won ${t[w].wins} of ${t[w].played} matches and finished with a better goal difference.` }
    }
    return { winners: ['mohamed','mohaned'], why: `Both won ${a} matches over ${t.mohamed.played} played — split title.` }
  }
  const w = a > b ? 'mohamed' : 'mohaned'
  return { winners: [w], why: `${name(w)} won ${t[w].wins} of ${t[w].played} matches (drew ${t[w].draws}).` }
}
function prizePOTM(matches) {
  const t = standings(matches)
  const a = Math.round(t.mohamed.pIndex)
  const b = Math.round(t.mohaned.pIndex)
  if (a !== b) {
    const w = a > b ? 'mohamed' : 'mohaned'
    return { winners: [w], why: `${name(w)}'s total P-Index across the month was ${a > b ? a : b}, vs ${a > b ? b : a}.` }
  }
  if (t.mohamed.wins !== t.mohaned.wins) {
    const w = t.mohamed.wins > t.mohaned.wins ? 'mohamed' : 'mohaned'
    return { winners: [w], why: `Tied on P-Index (${a}); ${name(w)} took it on more match wins (${t[w].wins}).` }
  }
  if (t.mohamed.played !== t.mohaned.played) {
    const w = t.mohamed.played > t.mohaned.played ? 'mohamed' : 'mohaned'
    return { winners: [w], why: `Tied on P-Index (${a}); ${name(w)} played more matches.` }
  }
  return { winners: ['mohamed','mohaned'], why: `Dead-locked on every measure — shared Player of the Month.` }
}

function other(p) { return p === 'mohamed' ? 'mohaned' : 'mohamed' }

export function computePrizes(matches, kind) {
  const keys = kind === 'monthly' ? PRIZE_KEYS_MONTHLY : PRIZE_KEYS
  const out = {}
  if (keys.includes('goldenBoot'))    out.goldenBoot    = prizeBoot(matches)
  if (keys.includes('goldenVision'))  out.goldenVision  = prizeVision(matches)
  if (keys.includes('goldenSkills'))  out.goldenSkills  = prizeSkills(matches)
  if (keys.includes('winner'))        out.winner        = prizeWinner(matches)
  if (keys.includes('playerOfMonth')) out.playerOfMonth = prizePOTM(matches)
  return out
}

// ---------- One-live constraint ----------

export function activeBlockingCustom(rows, matches, today = todayStr()) {
  for (const row of rows) {
    if (row.data?.kind !== 'custom') continue
    if (row.data?.revealed) continue
    const status = tournamentStatus(row, matches, today)
    if (status === 'live' || status === 'upcoming') return row
  }
  return null
}
export function canCreateCustom(rows, matches, today = todayStr()) {
  return !activeBlockingCustom(rows, matches, today)
}

// ---------- Trophy cabinet ----------

export function trophyCabinet(rows) {
  const cab = {
    mohamed: { goldenBoot: [], goldenVision: [], goldenSkills: [], winner: [], playerOfMonth: [] },
    mohaned: { goldenBoot: [], goldenVision: [], goldenSkills: [], winner: [], playerOfMonth: [] }
  }
  for (const row of rows) {
    const d = row.data
    if (!d?.revealed || !d.results?.prizes) continue
    const entry = { key: row.key, name: d.name, kind: d.kind, badge: d.badge_key }
    for (const [prize, info] of Object.entries(d.results.prizes)) {
      if (!cab.mohamed[prize]) continue
      for (const winner of (info.winners || [])) {
        if (cab[winner]) cab[winner][prize].push(entry)
      }
    }
  }
  return cab
}

// ---------- Helpers for App / UI ----------

export function findTournament(rows, key) {
  return rows.find(r => r.key === key) || null
}

export function listTournaments(rows, matches, today = todayStr()) {
  // returns rows sorted: live first, then upcoming, then finished by most recent
  const decorated = rows.map(r => ({ row: r, status: tournamentStatus(r, matches, today) }))
  const rank = { live: 0, upcoming: 1, finished: 2 }
  decorated.sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status]
    const ka = sortKeyForRow(a.row)
    const kb = sortKeyForRow(b.row)
    return kb.localeCompare(ka)
  })
  return decorated
}

function sortKeyForRow(row) {
  const d = row.data
  if (d.kind === 'monthly') return d.month_key
  if (d.kind === 'yearly')  return String(d.year)
  return d.start_date || row.key
}

export function progressFor(row, matches) {
  const data = row.data
  const eligible = filterMatchesForTournament(row, matches)
  if (data.kind === 'custom') {
    const completed = eligible.length
    return { current: completed, total: data.matches_required, label: `Match ${Math.min(completed, data.matches_required)} of ${data.matches_required}` }
  }
  if (data.kind === 'monthly') {
    return { current: eligible.length, total: null, label: `${eligible.length} ${eligible.length === 1 ? 'match' : 'matches'} this month` }
  }
  if (data.kind === 'yearly') {
    return { current: eligible.length, total: null, label: `${eligible.length} ${eligible.length === 1 ? 'match' : 'matches'} this year` }
  }
  return { current: 0, total: null, label: '' }
}

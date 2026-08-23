// Generalized version of the old app's src/lib/tournaments.js — same date-window/tie-break
// concepts, but `decideStat`/prize generators work over any number of members instead of a
// hardcoded 2-key comparison, and every function takes `memberIds`/`statDefs`/`names` as
// parameters rather than importing a fixed player list.

import { performanceIndex, standingsForMembers, statValue, type StatDef, type Week } from './core'

export const PRIZE_KEYS = ['goldenBoot', 'goldenVision', 'goldenSkills', 'winner'] as const
export const PRIZE_KEYS_MONTHLY = [...PRIZE_KEYS, 'playerOfMonth'] as const
export type PrizeKey = (typeof PRIZE_KEYS_MONTHLY)[number]

export const PRIZE_META: Record<PrizeKey, { label: string; short: string; statKey: string | null }> = {
  goldenBoot: { label: 'Golden Boot', short: 'Boot', statKey: 'goals' },
  goldenVision: { label: 'Golden Vision', short: 'Vision', statKey: 'assists' },
  goldenSkills: { label: 'Golden Skills', short: 'Skills', statKey: 'dribbles' },
  winner: { label: 'Tournament Winner', short: 'Winner', statKey: null },
  playerOfMonth: { label: 'Player of the Month', short: 'POTM', statKey: null }
}

export type PrizeResult = { winners: string[]; why: string }

// ---------- Date helpers (timezone-safe; we only ever slice the yyyy-mm-dd string) ----------

export function monthKey(dateStr: string): string {
  return (dateStr || '').slice(0, 7)
}
export function yearKey(dateStr: string): string {
  return (dateStr || '').slice(0, 4)
}
export function todayStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
export function monthLabel(mk: string): string {
  if (!mk) return ''
  const [y, m] = mk.split('-').map(Number)
  const d = new Date(Date.UTC(y, (m || 1) - 1, 1))
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

// ---------- Tournament shape (plain, mirrors the Tournament mongoose doc) ----------

export type TournamentRow = {
  key: string
  kind: 'monthly' | 'yearly' | 'custom'
  name: string
  badgeKey: string
  leagueId: number | null
  monthKey?: string | null
  year?: number | null
  startDate?: string | null
  matchesRequired?: number | null
  revealed: boolean
  results: { prizes: Record<string, PrizeResult> } | null
}

// A week "counts" toward tournament progress once at least 2 members logged it — the closest
// generalized equivalent of the old app's isComplete() (loggedBy.length === 2).
function isPlayed(week: Week): boolean {
  return week.entries.length >= 2
}

export function filterWeeksForTournament(row: TournamentRow, weeks: Week[]): Week[] {
  const sorted = [...weeks].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  if (row.kind === 'monthly') {
    return sorted.filter((w) => monthKey(w.date) === row.monthKey)
  }
  if (row.kind === 'yearly') {
    return sorted.filter((w) => yearKey(w.date) === String(row.year))
  }
  if (row.kind === 'custom') {
    return sorted
      .filter(isPlayed)
      .filter((w) => (w.date || '') >= (row.startDate || ''))
      .slice(0, row.matchesRequired ?? 0)
  }
  return []
}

export function tournamentStatus(
  row: TournamentRow,
  weeks: Week[],
  today: string = todayStr()
): 'upcoming' | 'live' | 'finished' {
  if (row.kind === 'monthly') {
    return (row.monthKey ?? '') < monthKey(today) ? 'finished' : 'live'
  }
  if (row.kind === 'yearly') {
    return String(row.year) < yearKey(today) ? 'finished' : 'live'
  }
  if (row.kind === 'custom') {
    if (today < (row.startDate || '')) return 'upcoming'
    const eligible = filterWeeksForTournament(row, weeks)
    return eligible.length >= (row.matchesRequired || 0) ? 'finished' : 'live'
  }
  return 'live'
}

// ---------- Tie-breaker pipeline (N-way generalization of the old 2-way `decideStat`) ----------

function bestSingleWeek(weeks: Week[], userId: string, statKey: string): number {
  let best = 0
  for (const w of weeks) {
    const entry = w.entries.find((e) => e.userId === userId)
    const v = statValue(entry?.stats, statKey)
    if (v > best) best = v
  }
  return best
}

function maxWinners<T>(memberIds: string[], valueOf: (id: string) => T, cmp: (a: T, b: T) => number): string[] {
  let best: T | null = null
  let winners: string[] = []
  for (const id of memberIds) {
    const v = valueOf(id)
    if (best === null || cmp(v, best) > 0) {
      best = v
      winners = [id]
    } else if (cmp(v, best) === 0) {
      winners.push(id)
    }
  }
  return winners
}

function decideStat(
  weeks: Week[],
  memberIds: string[],
  statDefs: StatDef[],
  resultKey: string,
  statKey: string
): { winners: string[]; totals: Record<string, number> } {
  const standings = standingsForMembers(weeks, memberIds, statDefs, resultKey)
  const totals = Object.fromEntries(memberIds.map((id) => [id, standings[id]?.totals[statKey] || 0]))

  let winners = maxWinners(memberIds, (id) => totals[id], (a, b) => a - b)
  if (winners.length === 1) return { winners, totals }

  winners = maxWinners(winners, (id) => bestSingleWeek(weeks, id, statKey), (a, b) => a - b)
  if (winners.length === 1) return { winners, totals }

  winners = maxWinners(winners, (id) => standings[id]?.wins || 0, (a, b) => a - b)
  if (winners.length === 1) return { winners, totals }

  winners = maxWinners(winners, (id) => standings[id]?.played || 0, (a, b) => a - b)
  return { winners, totals }
}

function nameOf(names: Record<string, string>, id: string) {
  return names[id] || id
}
function statPhrase(names: Record<string, string>, winners: string[], totals: Record<string, number>, unit: string) {
  if (winners.length > 1) {
    return `${winners.length > 2 ? 'All tied' : 'Both finished tied'} on ${totals[winners[0]]} ${unit}.`
  }
  const w = winners[0]
  const others = Object.keys(totals).filter((id) => id !== w)
  const otherText = others.map((id) => `${nameOf(names, id)} had ${totals[id]}`).join(', ')
  return `${nameOf(names, w)} led with ${totals[w]} ${unit}${otherText ? ` (${otherText})` : ''}.`
}

function prizeBoot(weeks: Week[], memberIds: string[], statDefs: StatDef[], resultKey: string, names: Record<string, string>): PrizeResult {
  const r = decideStat(weeks, memberIds, statDefs, resultKey, 'goals')
  return { winners: r.winners, why: statPhrase(names, r.winners, r.totals, 'goals') }
}
function prizeVision(weeks: Week[], memberIds: string[], statDefs: StatDef[], resultKey: string, names: Record<string, string>): PrizeResult {
  const r = decideStat(weeks, memberIds, statDefs, resultKey, 'assists')
  return { winners: r.winners, why: statPhrase(names, r.winners, r.totals, 'assists') }
}
function prizeSkills(weeks: Week[], memberIds: string[], statDefs: StatDef[], resultKey: string, names: Record<string, string>): PrizeResult {
  const r = decideStat(weeks, memberIds, statDefs, resultKey, 'dribbles')
  return { winners: r.winners, why: statPhrase(names, r.winners, r.totals, 'dribbles') }
}

function prizeWinner(weeks: Week[], memberIds: string[], statDefs: StatDef[], resultKey: string, names: Record<string, string>): PrizeResult {
  const standings = standingsForMembers(weeks, memberIds, statDefs, resultKey)
  let winners = maxWinners(memberIds, (id) => standings[id]?.wins || 0, (a, b) => a - b)
  if (winners.length > 1) {
    const gd = (id: string) => (standings[id]?.totals[resultKey] || 0) - sumOpponentResult(weeks, id, resultKey)
    winners = maxWinners(winners, gd, (a, b) => a - b)
  }
  if (winners.length === 1) {
    const w = winners[0]
    return { winners, why: `${nameOf(names, w)} won ${standings[w].wins} of ${standings[w].played} matches (drew ${standings[w].draws}).` }
  }
  return { winners, why: `Tied on ${standings[winners[0]]?.wins ?? 0} wins each — split title.` }
}

// Approximate "goals against" for a member across all their played weeks (sum of opponents' result-stat values).
function sumOpponentResult(weeks: Week[], userId: string, resultKey: string): number {
  let total = 0
  for (const week of weeks) {
    if (week.entries.length < 2) continue
    const mine = week.entries.find((e) => e.userId === userId)
    if (!mine) continue
    for (const e of week.entries) {
      if (e.userId === userId) continue
      total += statValue(e.stats, resultKey)
    }
  }
  return total
}

function prizePOTM(weeks: Week[], memberIds: string[], statDefs: StatDef[], resultKey: string, names: Record<string, string>): PrizeResult {
  const standings = standingsForMembers(weeks, memberIds, statDefs, resultKey)
  let winners = maxWinners(memberIds, (id) => Math.round(standings[id]?.pIndex || 0), (a, b) => a - b)
  if (winners.length === 1) {
    const w = winners[0]
    return { winners, why: `${nameOf(names, w)}'s total P-Index was ${Math.round(standings[w].pIndex)}.` }
  }
  winners = maxWinners(winners, (id) => standings[id]?.wins || 0, (a, b) => a - b)
  if (winners.length === 1) {
    const w = winners[0]
    return { winners, why: `Tied on P-Index; ${nameOf(names, w)} took it on more match wins.` }
  }
  return { winners, why: 'Dead-locked on every measure — shared Player of the Month.' }
}

export function computePrizes(
  weeks: Week[],
  memberIds: string[],
  statDefs: StatDef[],
  resultKey: string,
  kind: 'monthly' | 'yearly' | 'custom',
  names: Record<string, string>
): Record<string, PrizeResult> {
  const keys: readonly string[] = kind === 'monthly' ? PRIZE_KEYS_MONTHLY : PRIZE_KEYS
  const out: Record<string, PrizeResult> = {}
  if (keys.includes('goldenBoot')) out.goldenBoot = prizeBoot(weeks, memberIds, statDefs, resultKey, names)
  if (keys.includes('goldenVision')) out.goldenVision = prizeVision(weeks, memberIds, statDefs, resultKey, names)
  if (keys.includes('goldenSkills')) out.goldenSkills = prizeSkills(weeks, memberIds, statDefs, resultKey, names)
  if (keys.includes('winner')) out.winner = prizeWinner(weeks, memberIds, statDefs, resultKey, names)
  if (keys.includes('playerOfMonth')) out.playerOfMonth = prizePOTM(weeks, memberIds, statDefs, resultKey, names)
  return out
}

// ---------- One-live-custom-tournament constraint ----------

export function activeBlockingCustom(rows: TournamentRow[], weeks: Week[], today: string = todayStr()): TournamentRow | null {
  for (const row of rows) {
    if (row.kind !== 'custom') continue
    if (row.revealed) continue
    const status = tournamentStatus(row, weeks, today)
    if (status === 'live' || status === 'upcoming') return row
  }
  return null
}
export function canCreateCustom(rows: TournamentRow[], weeks: Week[], today: string = todayStr()): boolean {
  return !activeBlockingCustom(rows, weeks, today)
}

// ---------- Trophy cabinet ----------

export function trophyCabinet(rows: TournamentRow[], memberIds: string[]) {
  const cab: Record<string, Record<string, { key: string; name: string; kind: string; badge: string; leagueId: number | null }[]>> = {}
  for (const id of memberIds) {
    cab[id] = { goldenBoot: [], goldenVision: [], goldenSkills: [], winner: [], playerOfMonth: [] }
  }
  for (const row of rows) {
    if (!row.revealed || !row.results?.prizes) continue
    const entry = { key: row.key, name: row.name, kind: row.kind, badge: row.badgeKey, leagueId: row.leagueId }
    for (const [prize, info] of Object.entries(row.results.prizes)) {
      for (const winner of info.winners || []) {
        if (cab[winner]?.[prize]) cab[winner][prize].push(entry)
      }
    }
  }
  return cab
}

// ---------- Challenge bonus points ----------

export function computeChallengeBonuses(weeks: Week[], memberIds: string[], challengePoints: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = Object.fromEntries(memberIds.map((id) => [id, 0]))
  for (const week of weeks) {
    for (const entry of week.entries as (Week['entries'][number] & { challengeCompletion?: { challengeId: string; completed: boolean } | null })[]) {
      const cc = entry.challengeCompletion
      if (!cc || !cc.completed) continue
      const points = challengePoints[cc.challengeId] || 0
      if (result[entry.userId] != null) result[entry.userId] += points
    }
  }
  return result
}

// ---------- Helpers for pages/services ----------

export function findTournament(rows: TournamentRow[], key: string): TournamentRow | null {
  return rows.find((r) => r.key === key) ?? null
}

export function listTournaments(rows: TournamentRow[], weeks: Week[], today: string = todayStr()) {
  const decorated = rows.map((row) => ({ row, status: tournamentStatus(row, weeks, today) }))
  const rank = { live: 0, upcoming: 1, finished: 2 }
  decorated.sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status]
    return sortKeyForRow(b.row).localeCompare(sortKeyForRow(a.row))
  })
  return decorated
}

function sortKeyForRow(row: TournamentRow): string {
  if (row.kind === 'monthly') return row.monthKey ?? ''
  if (row.kind === 'yearly') return String(row.year ?? '')
  return row.startDate ?? row.key
}

export function progressFor(row: TournamentRow, weeks: Week[]) {
  const eligible = filterWeeksForTournament(row, weeks)
  if (row.kind === 'custom') {
    const completed = eligible.length
    const total = row.matchesRequired ?? 0
    return { current: completed, total, label: `Match ${Math.min(completed, total)} of ${total}` }
  }
  if (row.kind === 'monthly') {
    return { current: eligible.length, total: null, label: `${eligible.length} ${eligible.length === 1 ? 'match' : 'matches'} this month` }
  }
  if (row.kind === 'yearly') {
    return { current: eligible.length, total: null, label: `${eligible.length} ${eligible.length === 1 ? 'match' : 'matches'} this year` }
  }
  return { current: 0, total: null, label: '' }
}

export { performanceIndex }

// Generalized version of the old app's src/lib/scouting.js — scouts a single member (identified
// by userId) against their own aggregated history, using the space-wide round-robin W/D/L helper
// from core.ts instead of an assumed single hardcoded opponent.

import { performanceIndex, statValue, weekRoundRobin, type StatDef, type Week } from './core'

export type Tier = {
  min: number
  max: number
  name: string
  sub: string
  shortName: string
  accent: string
  leagueId: number | null
}

export const TIERS: Tier[] = [
  { min: 0, max: 10, name: 'Office 5-a-side', sub: 'Casual lunchtime kickabout', shortName: 'Office 5s', accent: '#94a3b8', leagueId: null },
  { min: 11, max: 20, name: 'Sunday League Hopeful', sub: 'Hungover, but full of effort', shortName: 'Sunday League', accent: '#64748b', leagueId: null },
  { min: 21, max: 30, name: 'Egyptian Third Division', sub: 'Dusty pitch, real ambition', shortName: 'Egyptian D3', accent: '#a16207', leagueId: null },
  { min: 31, max: 40, name: 'Burkinabe Top Flight', sub: 'Local cult hero', shortName: 'Burkinabe', accent: '#b45309', leagueId: null },
  { min: 41, max: 50, name: 'Belgian Pro League', sub: 'Solid European pro', shortName: 'Belgian Pro', accent: '#0891b2', leagueId: 144 },
  { min: 51, max: 60, name: 'Eredivisie Regular', sub: 'Eyed by mid-table scouts', shortName: 'Eredivisie', accent: '#0e7490', leagueId: 88 },
  { min: 61, max: 70, name: 'Serie A Squad Player', sub: 'Rotation option in a big league', shortName: 'Serie A', accent: '#15803d', leagueId: 135 },
  { min: 71, max: 80, name: 'Bundesliga Starter', sub: 'Locked-in first XI', shortName: 'Bundesliga', accent: '#047857', leagueId: 78 },
  { min: 81, max: 90, name: 'Premier League Star', sub: 'Highlight-reel regular', shortName: 'PL Star', accent: '#7c3aed', leagueId: 39 },
  { min: 91, max: 100, name: 'Champions League Elite', sub: 'Generational talent', shortName: 'UCL Elite', accent: '#be185d', leagueId: 2 }
]

const MIN_MATCHES = 3

export function tierForScore(score: number): Tier {
  const s = Math.max(0, Math.min(100, score))
  return TIERS.find((t) => s >= t.min && s <= t.max) || TIERS[0]
}

function nextTier(tier: Tier): Tier | null {
  const idx = TIERS.indexOf(tier)
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null
}

function safeDiv(a: number, b: number) { return b > 0 ? a / b : 0 }

type Aggregate = {
  totals: Record<string, number>
  played: number
  wins: number
  draws: number
  losses: number
  pIndex: number
}

function aggregatePlayer(weeks: Week[], userId: string, statDefs: StatDef[], resultKey: string): Aggregate {
  const totals = Object.fromEntries(statDefs.map((s) => [s.key, 0]))
  let played = 0, wins = 0, draws = 0, losses = 0, pIndex = 0
  for (const week of weeks) {
    const entry = week.entries.find((e) => e.userId === userId)
    if (!entry || week.entries.length < 2) continue
    for (const s of statDefs) totals[s.key] += statValue(entry.stats, s.key)
    pIndex += performanceIndex(entry.stats, statDefs)
    const rr = weekRoundRobin(week, resultKey).get(userId)!
    played++
    if (rr.w > rr.l) wins++
    else if (rr.l > rr.w) losses++
    else draws++
  }
  return { totals, played, wins, draws, losses, pIndex }
}

function recentForm(weeks: Week[], userId: string, resultKey: string, limit = 5): ('W' | 'D' | 'L')[] {
  const sorted = weeks
    .filter((w) => w.entries.length >= 2 && w.entries.some((e) => e.userId === userId))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
  return sorted.map((week) => {
    const rr = weekRoundRobin(week, resultKey).get(userId)!
    if (rr.w > rr.l) return 'W'
    if (rr.l > rr.w) return 'L'
    return 'D'
  })
}

function streakFrom(form: string[]) {
  if (!form.length) return { result: null as string | null, count: 0 }
  const first = form[0]
  let n = 1
  while (n < form.length && form[n] === first) n++
  return { result: first, count: n }
}

const WEIGHTS = {
  goals: 5.0, assists: 5.0, dribbles: 0.9, shotsOnTarget: 0.6, possessionWon: 0.4,
  winRate: 25, pIndexBonus: 0.15
}

type Driver = { key: string; label: string; value: string; points: number }

function rawScore(agg: Aggregate): { raw: number; drivers: Driver[] } {
  if (agg.played < 1) return { raw: 0, drivers: [] }
  const perGame = (key: string) => safeDiv(agg.totals[key] || 0, agg.played)
  const gpg = perGame('goals')
  const apg = perGame('assists')
  const dpg = perGame('dribbles')
  const stpg = perGame('shotsOnTarget')
  const pwpg = perGame('possessionWon')
  const winRate = safeDiv(agg.wins, agg.played)
  const pIndexAvg = safeDiv(agg.pIndex, agg.played)

  const drivers: Driver[] = [
    { key: 'goals', label: 'Goals/game', value: gpg.toFixed(2), points: gpg * WEIGHTS.goals },
    { key: 'assists', label: 'Assists/game', value: apg.toFixed(2), points: apg * WEIGHTS.assists },
    { key: 'winRate', label: 'Win rate', value: `${Math.round(winRate * 100)}%`, points: winRate * WEIGHTS.winRate },
    { key: 'dribbles', label: 'Dribbles/game', value: dpg.toFixed(1), points: dpg * WEIGHTS.dribbles },
    { key: 'shotsOnTarget', label: 'Shots OT/game', value: stpg.toFixed(1), points: stpg * WEIGHTS.shotsOnTarget },
    { key: 'possessionWon', label: 'Possession won/g', value: pwpg.toFixed(1), points: pwpg * WEIGHTS.possessionWon },
    { key: 'pIndex', label: 'P-Index avg', value: pIndexAvg.toFixed(1), points: pIndexAvg * WEIGHTS.pIndexBonus }
  ]
  const raw = drivers.reduce((s, d) => s + d.points, 0)
  return { raw, drivers }
}

function applyModifiers(raw: number, form: string[]) {
  const streak = streakFrom(form)
  const mods: { label: string; delta: number; dir: 'up' | 'down' }[] = []

  if (streak.result === 'W' && streak.count >= 3) mods.push({ label: `Win streak ×${streak.count}`, delta: 5, dir: 'up' })
  else if (streak.result === 'L' && streak.count >= 3) mods.push({ label: `Loss streak ×${streak.count}`, delta: -8, dir: 'down' })

  if (form.length >= 5) {
    const wins = form.filter((r) => r === 'W').length
    const losses = form.filter((r) => r === 'L').length
    if (wins >= 4) mods.push({ label: 'Hot form (4+W last 5)', delta: 3, dir: 'up' })
    else if (losses >= 4) mods.push({ label: 'Cold form (4+L last 5)', delta: -4, dir: 'down' })
  }

  const totalDelta = mods.reduce((s, m) => s + m.delta, 0)
  const adjusted = raw * (1 + totalDelta / 100)
  return { adjusted, mods }
}

function marketValueFromScore(score: number): number {
  if (score <= 0) return 0
  const v = 10000 * Math.pow(score / 10, 4.3)
  return Math.min(v, 200_000_000)
}

export function formatMoney(value: number): string {
  if (value <= 0) return '€0'
  if (value < 1_000) return `€${Math.round(value)}`
  if (value < 1_000_000) return `€${Math.round(value / 1_000)}K`
  if (value < 10_000_000) return `€${(value / 1_000_000).toFixed(2)}M`
  if (value < 1_000_000_000) return `€${(value / 1_000_000).toFixed(1)}M`
  return `€${(value / 1_000_000_000).toFixed(2)}B`
}

export type ScoutReport =
  | { unscouted: true; played: number; needed: number; tier: null; score: 0; marketValue: 0; formattedValue: '—'; drivers: []; mods: []; form: [] }
  | {
      unscouted: false
      played: number
      score: number
      tier: Tier
      nextTier: (Tier & { scoreNeeded: number }) | null
      marketValue: number
      formattedValue: string
      drivers: Driver[]
      mods: { label: string; delta: number; dir: 'up' | 'down' }[]
      form: string[]
      rawScore: number
    }

export function scoutPlayer(weeks: Week[], userId: string, statDefs: StatDef[], resultKey: string): ScoutReport {
  const agg = aggregatePlayer(weeks, userId, statDefs, resultKey)
  if (agg.played < MIN_MATCHES) {
    return {
      unscouted: true, played: agg.played, needed: MIN_MATCHES, tier: null, score: 0,
      marketValue: 0, formattedValue: '—', drivers: [], mods: [], form: []
    }
  }

  const { raw, drivers } = rawScore(agg)
  const form = recentForm(weeks, userId, resultKey)
  const { adjusted, mods } = applyModifiers(raw, form)

  const score = Math.max(0, Math.min(99, Math.round(adjusted * 10) / 10))
  const tier = tierForScore(score)
  const nt = nextTier(tier)
  const marketValue = marketValueFromScore(score)

  return {
    unscouted: false, played: agg.played, score, tier,
    nextTier: nt ? { ...nt, scoreNeeded: Math.max(0, nt.min - score) } : null,
    marketValue, formattedValue: formatMoney(marketValue),
    drivers: drivers.slice().sort((a, b) => b.points - a.points), mods, form,
    rawScore: Math.round(raw * 10) / 10
  }
}

export function scoutAll(weeks: Week[], memberIds: string[], statDefs: StatDef[], resultKey: string): Record<string, ScoutReport> {
  return Object.fromEntries(memberIds.map((id) => [id, scoutPlayer(weeks, id, statDefs, resultKey)]))
}

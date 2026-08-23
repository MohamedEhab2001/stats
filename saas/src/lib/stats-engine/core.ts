// Generalized version of the old app's src/lib/stats.js. Every function here is pure (no DB
// imports) and takes `statDefs`/`memberIds` as parameters instead of a hardcoded 2-key object,
// so a Space's configurable/toggleable stat attributes and arbitrary member count both "just
// work" without special-casing.

export type StatDef = {
  key: string
  label: string
  weight: number
  higherIsBetter: boolean
}

export type EntryStats = Record<string, number>

export type MemberEntry = {
  userId: string
  stats: EntryStats
}

export type Week = {
  id: string
  date: string // 'YYYY-MM-DD'
  entries: MemberEntry[]
}

export type Result = 'W' | 'D' | 'L'

export function statValue(stats: EntryStats | undefined, key: string): number {
  return Number(stats?.[key]) || 0
}

export function emptyStats(statDefs: StatDef[]): EntryStats {
  return Object.fromEntries(statDefs.map((s) => [s.key, 0]))
}

export function performanceIndex(stats: EntryStats | undefined, statDefs: StatDef[]): number {
  if (!stats) return 0
  return statDefs.reduce((sum, s) => sum + statValue(stats, s.key) * s.weight, 0)
}

export function getEntry(week: Week, userId: string): MemberEntry | undefined {
  return week.entries.find((e) => e.userId === userId)
}

export function loggedUserIds(week: Week): string[] {
  return week.entries.map((e) => e.userId)
}

export function hasLogged(week: Week, userId: string): boolean {
  return week.entries.some((e) => e.userId === userId)
}

/** Result for `a` relative to `b` on a single week, based on the space's result stat (default 'goals'). */
export function pairwiseResult(a: EntryStats, b: EntryStats, resultKey: string): Result {
  const av = statValue(a, resultKey)
  const bv = statValue(b, resultKey)
  if (av > bv) return 'W'
  if (av < bv) return 'L'
  return 'D'
}

function flip(r: Result): Result {
  if (r === 'W') return 'L'
  if (r === 'L') return 'W'
  return 'D'
}

/**
 * All-play-all round robin for a single week: every unique pair of that week's loggers is
 * compared on `resultKey`. Reduces exactly to the old 2-player W/D/L behavior when a week has
 * exactly 2 loggers.
 */
export function weekRoundRobin(
  week: Week,
  resultKey: string
): Map<string, { w: number; d: number; l: number; vs: { opponentId: string; result: Result }[] }> {
  const out = new Map<string, { w: number; d: number; l: number; vs: { opponentId: string; result: Result }[] }>()
  for (const e of week.entries) out.set(e.userId, { w: 0, d: 0, l: 0, vs: [] })

  const entries = week.entries
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i]
      const b = entries[j]
      const result = pairwiseResult(a.stats, b.stats, resultKey)
      const bResult = flip(result)
      const aRec = out.get(a.userId)!
      const bRec = out.get(b.userId)!
      aRec.vs.push({ opponentId: b.userId, result })
      bRec.vs.push({ opponentId: a.userId, result: bResult })
      if (result === 'W') { aRec.w++; bRec.l++ }
      else if (result === 'L') { aRec.l++; bRec.w++ }
      else { aRec.d++; bRec.d++ }
    }
  }
  return out
}

export type MemberStandingRow = {
  totals: EntryStats
  pIndex: number
  wins: number
  draws: number
  losses: number
  played: number
}

/** Space-wide N-way standings: trivial reduce for totals/P-Index, round-robin for W/D/L. */
export function standingsForMembers(
  weeks: Week[],
  memberIds: string[],
  statDefs: StatDef[],
  resultKey: string
): Record<string, MemberStandingRow> {
  const out: Record<string, MemberStandingRow> = {}
  for (const id of memberIds) {
    out[id] = { totals: emptyStats(statDefs), pIndex: 0, wins: 0, draws: 0, losses: 0, played: 0 }
  }

  for (const week of weeks) {
    for (const entry of week.entries) {
      const row = out[entry.userId]
      if (!row) continue
      for (const s of statDefs) row.totals[s.key] += statValue(entry.stats, s.key)
      row.pIndex += performanceIndex(entry.stats, statDefs)
    }
    if (week.entries.length < 2) continue
    const rr = weekRoundRobin(week, resultKey)
    for (const [userId, rec] of rr) {
      const row = out[userId]
      if (!row) continue
      row.wins += rec.w
      row.draws += rec.d
      row.losses += rec.l
      row.played += rec.w + rec.d + rec.l
    }
  }
  return out
}

/** Per-week result for one member, derived from majority outcome across that week's opponents. */
export function formForMember(
  weeks: Week[],
  userId: string,
  resultKey: string,
  limit = 5
): Result[] {
  const relevant = weeks
    .filter((w) => hasLogged(w, userId) && w.entries.length >= 2)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)

  return relevant.map((week) => {
    const rr = weekRoundRobin(week, resultKey).get(userId)!
    if (rr.w > rr.l) return 'W'
    if (rr.l > rr.w) return 'L'
    return 'D'
  })
}

export function currentStreak(form: Result[]): { result: Result | null; count: number } {
  if (!form.length) return { result: null, count: 0 }
  const first = form[0]
  let n = 1
  while (n < form.length && form[n] === first) n++
  return { result: first, count: n }
}

export function findBests(weeks: Week[], userId: string, statDefs: StatDef[]): EntryStats {
  const bests = emptyStats(statDefs)
  for (const week of weeks) {
    const entry = getEntry(week, userId)
    if (!entry) continue
    for (const s of statDefs) {
      if (!s.higherIsBetter) continue
      const v = statValue(entry.stats, s.key)
      if (v > bests[s.key]) bests[s.key] = v
    }
  }
  return bests
}

export function diffBests(
  before: EntryStats,
  after: EntryStats,
  statDefs: StatDef[]
): { key: string; label: string; value: number }[] {
  const broken: { key: string; label: string; value: number }[] = []
  for (const s of statDefs) {
    if (!s.higherIsBetter) continue
    if (after[s.key] > before[s.key] && after[s.key] > 0) {
      broken.push({ key: s.key, label: s.label, value: after[s.key] })
    }
  }
  return broken
}

// ---------- Pairwise (any-two-members compare) ----------
// This is a direct, unmodified port of the old app's pairwise math (stats.js), since a
// head-to-head comparison between exactly two chosen members is structurally identical to what
// the old app always computed.

export type PairwiseRecord = { w: number; d: number; l: number; gf: number; ga: number }

export function computePairwiseRecord(
  weeks: Week[],
  a: string,
  b: string,
  resultKey: string
): { a: PairwiseRecord; b: PairwiseRecord } {
  const rec = { a: { w: 0, d: 0, l: 0, gf: 0, ga: 0 }, b: { w: 0, d: 0, l: 0, gf: 0, ga: 0 } }
  for (const week of weeks) {
    const ea = getEntry(week, a)
    const eb = getEntry(week, b)
    if (!ea || !eb) continue
    const av = statValue(ea.stats, resultKey)
    const bv = statValue(eb.stats, resultKey)
    rec.a.gf += av; rec.a.ga += bv
    rec.b.gf += bv; rec.b.ga += av
    if (av > bv) { rec.a.w++; rec.b.l++ }
    else if (av < bv) { rec.b.w++; rec.a.l++ }
    else { rec.a.d++; rec.b.d++ }
  }
  return rec
}

export function pairwisePerStatRecord(
  weeks: Week[],
  a: string,
  b: string,
  statDefs: StatDef[]
): Record<string, { a: number; b: number; ties: number }> {
  const out: Record<string, { a: number; b: number; ties: number }> = {}
  for (const s of statDefs) out[s.key] = { a: 0, b: 0, ties: 0 }
  for (const week of weeks) {
    const ea = getEntry(week, a)
    const eb = getEntry(week, b)
    if (!ea || !eb) continue
    for (const s of statDefs) {
      const av = statValue(ea.stats, s.key)
      const bv = statValue(eb.stats, s.key)
      if (av === bv) { out[s.key].ties++; continue }
      const aLeads = s.higherIsBetter ? av > bv : av < bv
      if (aLeads) out[s.key].a++
      else out[s.key].b++
    }
  }
  return out
}

/** Weeks where both members logged an entry — the shared history used for any pairwise view. */
export function sharedWeeks(weeks: Week[], a: string, b: string): Week[] {
  return weeks.filter((w) => hasLogged(w, a) && hasLogged(w, b))
}

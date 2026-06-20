import { supabase, isConfigured } from './supabase.js'
import { EMPTY_STATS } from './stats.js'
import { monthKey, yearKey } from './tournaments.js'
import NAMES, { randomName } from './tournamentNames.js'
import { randomBadgeKey } from './badges.js'
import { randomBigTournamentId, randomCupId, findLeague } from './leagues.js'

const TABLE = 'matches'
const TOURNEY_TABLE = 'tournament_state'

const fillSide = (side) => ({ ...EMPTY_STATS(), ...(side || {}) })

export function fromRow(row) {
  return {
    id: row.id,
    week: row.week,
    date: row.date,
    mohamed: fillSide(row.mohamed),
    mohaned: fillSide(row.mohaned),
    loggedBy: row.logged_by || [],
    challengeResult: row.challenge_result || null
  }
}

export function toRow(m) {
  return {
    id: m.id,
    week: m.week,
    date: m.date,
    mohamed: m.mohamed,
    mohaned: m.mohaned,
    logged_by: m.loggedBy || [],
    challenge_result: m.challengeResult || null
  }
}

export async function fetchAll() {
  if (!isConfigured) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('week', { ascending: false })
  if (error) throw error
  return (data || []).map(fromRow)
}

export async function upsertMatch(match) {
  if (!isConfigured) throw new Error('Supabase not configured')
  const { error } = await supabase
    .from(TABLE)
    .upsert(toRow(match), { onConflict: 'id' })
  if (error) throw error
  // After a successful match write, ensure the calendar tournament rows exist.
  // Failures here are non-fatal — they'll be retried next time a match in that month is logged.
  try { await ensureCalendarRows(match.date) } catch (e) { console.warn('ensureCalendarRows failed', e) }
}

export async function deleteMatch(id) {
  if (!isConfigured) throw new Error('Supabase not configured')
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

export function subscribe(onChange) {
  if (!isConfigured) return () => {}
  const channel = supabase
    .channel(`matches-${Math.floor(Math.random() * 1e9)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
      onChange()
    })
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

export async function bulkInsert(matches) {
  if (!isConfigured) throw new Error('Supabase not configured')
  if (!matches.length) return
  const { error } = await supabase
    .from(TABLE)
    .upsert(matches.map(toRow), { onConflict: 'id' })
  if (error) throw error
}

// ----------------- Tournaments -----------------

export async function fetchTournamentStates() {
  if (!isConfigured) return []
  const { data, error } = await supabase
    .from(TOURNEY_TABLE)
    .select('*')
  if (error) {
    console.warn('fetchTournamentStates failed', error)
    return []
  }
  return data || []
}

export async function upsertTournamentState(key, data) {
  if (!isConfigured) throw new Error('Supabase not configured')
  const payload = { key, data, updated_at: new Date().toISOString() }
  const { error } = await supabase
    .from(TOURNEY_TABLE)
    .upsert(payload, { onConflict: 'key' })
  if (error) throw error
}

export async function insertTournamentIfMissing(key, data) {
  if (!isConfigured) return false
  // ON CONFLICT DO NOTHING via upsert + ignoreDuplicates
  const { error, data: rows } = await supabase
    .from(TOURNEY_TABLE)
    .upsert({ key, data }, { onConflict: 'key', ignoreDuplicates: true })
    .select()
  if (error) { console.warn('insertTournamentIfMissing failed', error); return false }
  return !!(rows && rows.length)
}

export async function updateTournamentField(key, patch) {
  if (!isConfigured) throw new Error('Supabase not configured')
  const { data: existing, error: readErr } = await supabase
    .from(TOURNEY_TABLE)
    .select('data')
    .eq('key', key)
    .single()
  if (readErr) throw readErr
  const next = { ...existing.data, ...patch }
  await upsertTournamentState(key, next)
  return next
}

export async function markRevealed(key, results) {
  // Conditional update: only write if not already revealed.
  if (!isConfigured) throw new Error('Supabase not configured')
  const { data: existing, error: readErr } = await supabase
    .from(TOURNEY_TABLE)
    .select('data')
    .eq('key', key)
    .single()
  if (readErr) throw readErr
  if (existing?.data?.revealed) return { applied: false, current: existing.data }
  const next = { ...existing.data, revealed: true, results }
  const { error } = await supabase
    .from(TOURNEY_TABLE)
    .update({ data: next, updated_at: new Date().toISOString(), finalized_at: new Date().toISOString() })
    .eq('key', key)
    .eq('data->>revealed', 'false')
  if (error) throw error
  return { applied: true, current: next }
}

export function subscribeTournaments(onChange) {
  if (!isConfigured) return () => {}
  const channel = supabase
    .channel(`tournaments-${Math.floor(Math.random() * 1e9)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: TOURNEY_TABLE }, () => {
      onChange()
    })
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

async function ensureCalendarRows(dateStr) {
  const mk = monthKey(dateStr)
  const yk = yearKey(dateStr)
  if (mk) {
    const cupId = randomCupId()
    const key = `monthly-${mk}`
    await insertTournamentIfMissing(key, {
      schema_version: 1,
      kind: 'monthly',
      name: findLeague(cupId)?.name || randomName(),
      badge_key: randomBadgeKey(),
      league_id: cupId,
      month_key: mk,
      revealed: false,
      results: null
    })
  }
  if (yk) {
    const bigId = randomBigTournamentId()
    const key = `yearly-${yk}`
    await insertTournamentIfMissing(key, {
      schema_version: 1,
      kind: 'yearly',
      name: findLeague(bigId)?.name || `Season ${yk}`,
      badge_key: 'wreath',
      league_id: bigId,
      year: Number(yk),
      revealed: false,
      results: null
    })
  }
}

export async function ensureCalendarRowsForDates(dateStrs) {
  const months = new Set()
  const years = new Set()
  for (const d of dateStrs || []) {
    const mk = monthKey(d); if (mk) months.add(mk)
    const yk = yearKey(d);  if (yk) years.add(yk)
  }
  const tasks = []
  for (const mk of months) {
    const cupId = randomCupId()
    tasks.push(insertTournamentIfMissing(`monthly-${mk}`, {
      schema_version: 1,
      kind: 'monthly',
      name: findLeague(cupId)?.name || randomName(),
      badge_key: randomBadgeKey(),
      league_id: cupId,
      month_key: mk,
      revealed: false,
      results: null
    }))
  }
  for (const yk of years) {
    const bigId = randomBigTournamentId()
    tasks.push(insertTournamentIfMissing(`yearly-${yk}`, {
      schema_version: 1,
      kind: 'yearly',
      name: findLeague(bigId)?.name || `Season ${yk}`,
      badge_key: 'wreath',
      league_id: bigId,
      year: Number(yk),
      revealed: false,
      results: null
    }))
  }
  const results = await Promise.allSettled(tasks)
  return results.some(r => r.status === 'fulfilled' && r.value === true)
}

export async function backfillTournamentLeagues() {
  if (!isConfigured) return
  const { data: rows, error } = await supabase.from(TOURNEY_TABLE).select('*')
  if (error || !rows?.length) return
  const tasks = []
  for (const row of rows) {
    const d = row.data
    if (!d || d.league_id != null) continue
    if (d.kind === 'yearly') {
      const id = randomBigTournamentId()
      tasks.push(upsertTournamentState(row.key, { ...d, league_id: id, name: findLeague(id)?.name || d.name }))
    } else if (d.kind === 'monthly') {
      const id = randomCupId()
      tasks.push(upsertTournamentState(row.key, { ...d, league_id: id, name: findLeague(id)?.name || d.name }))
    }
  }
  if (tasks.length) await Promise.allSettled(tasks)
}

export async function createCustomTournament({ name, badge_key, league_id, start_date, matches_required }) {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `c${Date.now()}${Math.floor(Math.random()*1e6)}`
  const key = `custom-${id}`
  const data = {
    schema_version: 1,
    kind: 'custom',
    name,
    badge_key,
    league_id: league_id || null,
    start_date,
    matches_required,
    revealed: false,
    results: null
  }
  await upsertTournamentState(key, data)
  return { key, data }
}

// ── Active Challenge (stored as tournament_state key 'active-challenge') ──

export async function fetchActiveChallenge() {
  if (!isConfigured) return null
  const { data, error } = await supabase
    .from(TOURNEY_TABLE)
    .select('data')
    .eq('key', 'active-challenge')
    .maybeSingle()
  if (error || !data) return null
  return data.data // { challenge_id, set_at }
}

export async function setActiveChallenge(challengeId) {
  await upsertTournamentState('active-challenge', {
    challenge_id: challengeId,
    set_at: new Date().toISOString()
  })
}

export async function deleteTournament(key) {
  if (!isConfigured) throw new Error('Supabase not configured')
  const { error } = await supabase.from(TOURNEY_TABLE).delete().eq('key', key)
  if (error) throw error
}

export async function clearActiveChallenge() {
  if (!isConfigured) return
  const { error } = await supabase.from(TOURNEY_TABLE).delete().eq('key', 'active-challenge')
  if (error) throw error
}

// ── Avatars ─────────────────────────────────────────────────────────────────
// Stored as base64 data URLs in tournament_state keys 'avatar-mohamed' / 'avatar-mohaned'

export async function fetchAvatars() {
  if (!isConfigured) return { mohamed: null, mohaned: null }
  const { data } = await supabase
    .from(TOURNEY_TABLE).select('key, data')
    .in('key', ['avatar-mohamed', 'avatar-mohaned'])
  const result = { mohamed: null, mohaned: null }
  for (const row of (data || [])) {
    if (row.key === 'avatar-mohamed') result.mohamed = row.data?.url || null
    if (row.key === 'avatar-mohaned') result.mohaned = row.data?.url || null
  }
  return result
}

export async function setAvatar(player, dataUrl) {
  await upsertTournamentState(`avatar-${player}`, { url: dataUrl })
}

// Re-export the names list for callers that want history of recent picks.
export { NAMES as TOURNEY_NAMES }

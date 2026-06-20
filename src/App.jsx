import { useEffect, useMemo, useRef, useState } from 'react'
import PlayerCards, { StatGrid } from './components/Scoreboard.jsx'
import TrendChart from './components/TrendChart.jsx'
import MatchLog from './components/MatchLog.jsx'
import AddMatchModal from './components/AddMatchModal.jsx'
import Login from './components/Login.jsx'
import Explainer from './components/Explainer.jsx'
import Toast from './components/Toast.jsx'
import PIndexBoard from './components/PIndexBoard.jsx'
import TournamentsPage from './components/TournamentsPage.jsx'
import ScoutingReport, { TierLadder } from './components/ScoutingReport.jsx'
import WeeklyChallengeCard from './components/WeeklyChallengeCard.jsx'
import ChallengeRevealCard from './components/ChallengeRevealCard.jsx'
import MOTMRevealModal from './components/MOTMRevealModal.jsx'
import {
  EMPTY_STATS,
  sumTotals, computeRecord, computeForm, currentStreak,
  perStatRecord, findBests, diffBests, isComplete
} from './lib/stats.js'
import { computeMOTM } from './lib/motm.js'
import {
  fetchAll, upsertMatch, deleteMatch, subscribe, bulkInsert,
  fetchTournamentStates, subscribeTournaments,
  createCustomTournament, markRevealed, ensureCalendarRowsForDates,
  backfillTournamentLeagues, fetchActiveChallenge, setActiveChallenge,
  fetchAvatars, setAvatar, deleteTournament
} from './lib/api.js'
import { findChallenge } from './lib/challenges.js'
import {
  computePrizes, filterMatchesForTournament, tournamentStatus
} from './lib/tournaments.js'
import { isConfigured } from './lib/supabase.js'
import { PlusIcon, TrendIcon, TrophyIcon, CalendarIcon, InfoIcon, LogoutIcon, ZapIcon, StarIcon } from './components/Icons.jsx'

const AUTH_KEY = 'mvm.auth'
const LEGACY_KEY = 'mvm.matches.v2'

export default function App() {
  const [authed, setAuthed] = useState(() => {
    try { return localStorage.getItem(AUTH_KEY) === 'ok' } catch { return false }
  })

  if (!authed) {
    return <Login onSuccess={() => {
      try { localStorage.setItem(AUTH_KEY, 'ok') } catch {}
      setAuthed(true)
    }} />
  }

  return <Board onLogout={() => {
    try { localStorage.removeItem(AUTH_KEY) } catch {}
    setAuthed(false)
  }} />
}

const TAB_KEY = 'mvm.tab'

function Board({ onLogout }) {
  const [matches, setMatches] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [revealingKey, setRevealingKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncState, setSyncState] = useState('connecting') // connecting | live | local | error
  const [errorMsg, setErrorMsg] = useState(null)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [motmMatch, setMotmMatch] = useState(null)
  const [avatars, setAvatars] = useState({ mohamed: null, mohaned: null })
  const [activeChallengeMeta, setActiveChallengeMeta] = useState(null) // { challenge_id, set_at }
  const [tab, setTab] = useState(() => {
    try { return localStorage.getItem(TAB_KEY) || 'overview' } catch { return 'overview' }
  })

  useEffect(() => {
    try { localStorage.setItem(TAB_KEY, tab) } catch {}
  }, [tab])
  const matchesRef = useRef(matches)
  matchesRef.current = matches

  // Initial load + realtime subscription
  useEffect(() => {
    let cancelled = false
    if (!isConfigured) {
      setErrorMsg('Supabase env vars missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_KEY to .env.local and restart.')
      setSyncState('error')
      setMatches([])
      setLoading(false)
      return
    }

    const refreshTournaments = async () => {
      try {
        const t = await fetchTournamentStates()
        if (!cancelled) setTournaments(t)
      } catch (e) {
        console.warn('tournament refresh failed', e)
      }
    }

    const backfillCalendarRows = async (matchesData) => {
      const dates = (matchesData || []).map(m => m.date).filter(Boolean)
      if (!dates.length) return
      try {
        const inserted = await ensureCalendarRowsForDates(dates)
        if (inserted && !cancelled) await refreshTournaments()
      } catch (e) {
        console.warn('calendar backfill failed', e)
      }
    }

    const load = async () => {
      try {
        const data = await fetchAll()
        if (cancelled) return
        let finalData = data
        if (data.length === 0) {
          const legacy = readLegacy()
          if (legacy.length) {
            await bulkInsert(legacy)
            const fresh = await fetchAll()
            if (cancelled) return
            setMatches(fresh)
            finalData = fresh
          } else {
            setMatches([])
            finalData = []
          }
        } else {
          setMatches(data)
        }
        setSyncState('live')
        setErrorMsg(null)
        backfillCalendarRows(finalData)
      } catch (e) {
        console.error(e)
        setSyncState('error')
        setErrorMsg(e.message || 'Failed to load matches.')
        setMatches([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    const unsubscribe = subscribe(async () => {
      try {
        const data = await fetchAll()
        if (!cancelled) setMatches(data)
      } catch (e) {
        console.warn('realtime refetch failed', e)
      }
    })

    refreshTournaments()
    backfillTournamentLeagues().then(() => { if (!cancelled) refreshTournaments() }).catch(() => {})
    const unsubscribeT = subscribeTournaments(() => {
      refreshTournaments()
      // Refresh active challenge when tournament_state changes (challenge may have been updated)
      fetchActiveChallenge().then(meta => { if (!cancelled) setActiveChallengeMeta(meta) }).catch(() => {})
    })

    fetchActiveChallenge().then(meta => { if (!cancelled) setActiveChallengeMeta(meta) }).catch(() => {})
    fetchAvatars().then(av => { if (!cancelled) setAvatars(av) }).catch(() => {})

    return () => { cancelled = true; unsubscribe(); unsubscribeT() }
  }, [])

  const totals = useMemo(() => sumTotals(matches), [matches])
  const record = useMemo(() => computeRecord(matches), [matches])
  const perStat = useMemo(() => perStatRecord(matches), [matches])
  const form = useMemo(() => ({
    mohamed: computeForm(matches, 'mohamed'),
    mohaned: computeForm(matches, 'mohaned')
  }), [matches])
  const streak = useMemo(() => ({
    mohamed: currentStreak(form.mohamed),
    mohaned: currentStreak(form.mohaned)
  }), [form])

  const latestWeek = matches.length ? Math.max(...matches.map(m => m.week)) : 0
  const completeCount = useMemo(() => matches.filter(m => (m.loggedBy || []).length === 2).length, [matches])

  const leader = record.mohamed.w > record.mohaned.w
    ? 'mohamed'
    : record.mohaned.w > record.mohamed.w
      ? 'mohaned'
      : null

  useEffect(() => {
    document.body.classList.remove('lead-mohamed', 'lead-mohaned')
    if (leader) document.body.classList.add(`lead-${leader}`)
    return () => document.body.classList.remove('lead-mohamed', 'lead-mohaned')
  }, [leader])

  const openNew = () => setModal({ mode: 'new' })
  const openEdit = (match) => setModal({ mode: 'edit', initial: match })
  const openAddSide = (match, player) => setModal({ mode: 'edit', initial: match, focus: player })

  const handleSetAvatar = async (player, dataUrl) => {
    setAvatars(prev => ({ ...prev, [player]: dataUrl }))
    try { await setAvatar(player, dataUrl) } catch (e) { console.error('save avatar failed', e) }
  }

  const handleUpsert = async (m) => {
    const prev = matchesRef.current
    const prevBests = {
      mohamed: findBests(prev, 'mohamed'),
      mohaned: findBests(prev, 'mohaned')
    }
    const idx = prev.findIndex(x => x.id === m.id)
    const wasComplete = idx >= 0 ? isComplete(prev[idx]) : false
    const next = idx >= 0 ? prev.map(x => x.id === m.id ? m : x) : [m, ...prev]
    const sorted = [...next].sort((a, b) => b.week - a.week)
    setMatches(sorted)

    try {
      await upsertMatch(m)
    } catch (e) {
      console.error('upsert failed', e)
      setErrorMsg("Couldn't save to server. Reverted.")
      setMatches(prev)
      return
    }

    // Show MOTM reveal when a match first becomes complete (both sides logged)
    if (isComplete(m) && !wasComplete) {
      setMotmMatch(m)
    }

    const newBests = {
      mohamed: findBests(sorted, 'mohamed'),
      mohaned: findBests(sorted, 'mohaned')
    }
    const loggedNow = m.loggedBy || []
    for (const player of loggedNow) {
      const recs = diffBests(prevBests[player], newBests[player])
      if (recs.length) {
        setToast({
          player,
          playerName: player === 'mohamed' ? 'Mohamed' : 'Mohaned',
          records: recs.map(r => ({ key: r.key, label: r.label, value: r.value }))
        })
        break
      }
    }
  }

  const handleCreateTournament = async (input) => {
    const { key, data } = await createCustomTournament(input)
    setTournaments(prev => prev.some(r => r.key === key) ? prev : [...prev, { key, data }])
  }

  const handleReveal = async (key) => {
    const row = tournaments.find(r => r.key === key)
    if (!row) return
    const status = tournamentStatus(row, matchesRef.current)
    if (status !== 'finished' || row.data.revealed) return
    setRevealingKey(key)
    try {
      const eligible = filterMatchesForTournament(row, matchesRef.current)
      const prizes = computePrizes(eligible, row.data.kind)
      const result = await markRevealed(key, { prizes })
      setTournaments(prev => prev.map(r => r.key === key ? { ...r, data: result.current } : r))
    } catch (e) {
      console.error('reveal failed', e)
      setErrorMsg("Couldn't reveal the tournament. Try again.")
    } finally {
      setRevealingKey(null)
    }
  }

  const handleDeleteTournament = async (key) => {
    setTournaments(prev => prev.filter(r => r.key !== key))
    try {
      await deleteTournament(key)
    } catch (e) {
      console.error('delete tournament failed', e)
      setErrorMsg("Couldn't delete tournament. Try again.")
      const t = await fetchTournamentStates().catch(() => null)
      if (t) setTournaments(t)
    }
  }

  const handleDelete = async (id) => {
    const prev = matchesRef.current
    setMatches(prev.filter(m => m.id !== id))
    try {
      await deleteMatch(id)
    } catch (e) {
      console.error('delete failed', e)
      setErrorMsg("Couldn't delete on server. Reverted.")
      setMatches(prev)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">Loading shared scoreboard…</div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark"><TrophyIcon size={18} /></div>
          <div className="brand-text">
            <div className="t1">Mohamed × Mohaned</div>
            <div className="t2">Weekly football stats · season 01</div>
          </div>
        </div>
        <div className="topbar-right">
          <SyncBadge state={syncState} />
          <div className="topbar-meta">
            <CalendarIcon size={14} />
            <span><strong>{matches.length}</strong> weeks · last <strong>W{latestWeek || '—'}</strong></span>
          </div>
          <button className="logout-btn" onClick={onLogout} aria-label="Log out">
            <LogoutIcon size={13} /> Lock
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="banner-error">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="banner-close">Dismiss</button>
        </div>
      )}

      <PlayerCards
        record={record}
        latestWeek={latestWeek}
        form={form}
        streak={streak}
        avatars={avatars}
        onSetAvatar={handleSetAvatar}
      />

      <nav className="tab-nav" role="tablist" aria-label="Sections">
        <TabButton id="overview" active={tab} onClick={setTab} icon={<TrophyIcon size={14} />}>
          Overview
        </TabButton>
        <TabButton id="pindex" active={tab} onClick={setTab} icon={<ZapIcon size={14} />}>
          P-Index
        </TabButton>
        <TabButton id="tournaments" active={tab} onClick={setTab} icon={<TrophyIcon size={14} />}>
          Tournaments
        </TabButton>
        <TabButton id="challenges" active={tab} onClick={setTab} icon={<StarIcon size={14} />}>
          Challenges
        </TabButton>
        <TabButton id="scouting" active={tab} onClick={setTab} icon={<ZapIcon size={14} />}>
          Scouting
        </TabButton>
      </nav>

      {tab === 'overview' && (
        <div className="tab-page" role="tabpanel" aria-labelledby="overview">
          <section className="section">
            <div className="section-head">
              <div className="left">
                <div className="icon-wrap"><TrophyIcon size={16} /></div>
                <div>
                  <h2>Head-to-head totals</h2>
                  <div className="sub">
                    Across {completeCount} complete {completeCount === 1 ? 'week' : 'weeks'}
                    {completeCount !== matches.length && ` · ${matches.length - completeCount} pending`}
                  </div>
                </div>
              </div>
            </div>
            <StatGrid totals={totals} perStat={perStat} />
          </section>

          {matches.length > 1 && (
            <section className="section">
              <div className="section-head">
                <div className="left">
                  <div className="icon-wrap"><TrendIcon size={16} /></div>
                  <div>
                    <h2>Trend over time</h2>
                    <div className="sub">P-Index is the default · tap any stat to switch</div>
                  </div>
                </div>
              </div>
              <TrendChart matches={matches} />
            </section>
          )}

          <section className="section">
            <div className="section-head">
              <div className="left">
                <div className="icon-wrap"><CalendarIcon size={16} /></div>
                <div>
                  <h2>Match log</h2>
                  <div className="sub">Edit or remove any week · most recent first</div>
                </div>
              </div>
              <button className="add-btn" onClick={openNew}>
                <PlusIcon size={14} /> Log this week
              </button>
            </div>
            <MatchLog
              matches={matches}
              onDelete={handleDelete}
              onEdit={openEdit}
              onAddSide={openAddSide}
            />
          </section>

          <section className="section">
            <div className="section-head">
              <div className="left">
                <div className="icon-wrap"><InfoIcon size={16} /></div>
                <div>
                  <h2>How it works</h2>
                  <div className="sub">Tap a stat to see what it counts</div>
                </div>
              </div>
            </div>
            <Explainer />
          </section>
        </div>
      )}

      {tab === 'pindex' && (
        <div className="tab-page" role="tabpanel" aria-labelledby="pindex">
          <section className="section">
            <div className="section-head">
              <div className="left">
                <div className="icon-wrap"><ZapIcon size={16} /></div>
                <div>
                  <h2>P-Index scoreboard</h2>
                  <div className="sub">Totals, averages, best weeks · stat-by-stat breakdown · week ladder</div>
                </div>
              </div>
              <button className="add-btn" onClick={openNew}>
                <PlusIcon size={14} /> Log this week
              </button>
            </div>
            <PIndexBoard matches={matches} />
          </section>
        </div>
      )}

      {tab === 'tournaments' && (
        <div className="tab-page" role="tabpanel" aria-labelledby="tournaments">
          <TournamentsPage
            matches={matches}
            tournaments={tournaments}
            onCreate={handleCreateTournament}
            onReveal={handleReveal}
            revealingKey={revealingKey}
            onDeleteTournament={handleDeleteTournament}
          />
        </div>
      )}

      {tab === 'challenges' && (
        <div className="tab-page" role="tabpanel" aria-labelledby="challenges">
          <section className="section">
            <div className="section-head">
              <div className="left">
                <div className="icon-wrap"><StarIcon size={16} /></div>
                <div>
                  <h2>Weekly Challenge</h2>
                  <div className="sub">Set one challenge per week · earn bonus points in every tournament's league table</div>
                </div>
              </div>
              <button className="add-btn" onClick={openNew}>
                <PlusIcon size={14} /> Log this week
              </button>
            </div>
            <ChallengeRevealCard
              activeChallenge={activeChallengeMeta}
              matches={matches}
              onChallengeChange={(meta) => setActiveChallengeMeta(meta)}
            />
            <WeeklyChallengeCard
              activeChallenge={activeChallengeMeta}
              matches={matches}
              onChallengeChange={(meta) => setActiveChallengeMeta(meta)}
            />
          </section>

          <section className="section">
            <div className="section-head">
              <div className="left">
                <div className="icon-wrap"><CalendarIcon size={16} /></div>
                <div>
                  <h2>Challenge history</h2>
                  <div className="sub">All matches where a challenge was active</div>
                </div>
              </div>
            </div>
            <ChallengeHistory matches={matches} />
          </section>
        </div>
      )}

      {tab === 'scouting' && (
        <div className="tab-page" role="tabpanel" aria-labelledby="scouting">
          <section className="section">
            <div className="section-head">
              <div className="left">
                <div className="icon-wrap"><ZapIcon size={16} /></div>
                <div>
                  <h2>Scouting report</h2>
                  <div className="sub">Your level if your stats were scaled to real football · tier + market value</div>
                </div>
              </div>
            </div>
            <ScoutingReport matches={matches} />
          </section>

          <section className="section">
            <div className="section-head">
              <div className="left">
                <div className="icon-wrap"><TrendIcon size={16} /></div>
                <div>
                  <h2>Tier road map</h2>
                  <div className="sub">All tiers from lowest to highest · see where you stand and what's next</div>
                </div>
              </div>
            </div>
            <TierLadder />
          </section>
        </div>
      )}

      <div className="footer">
        <span>Shared scoreboard · synced live across devices</span>
        <span>v0.5 · {new Date().getFullYear()}</span>
      </div>

      {modal && (
        <AddMatchModal
          mode={modal.mode}
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSubmit={(match) => { handleUpsert(match); setModal(null) }}
          activeChallenge={activeChallengeMeta?.challenge_id
            ? findChallenge(activeChallengeMeta.challenge_id)
            : null}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {motmMatch && (
        <MOTMRevealModal
          match={motmMatch}
          onClose={() => setMotmMatch(null)}
          avatars={avatars}
        />
      )}
    </div>
  )
}

function ChallengeHistory({ matches }) {
  const withChallenge = matches
    .filter(m => m.challengeResult?.challenge_id)
    .slice()
    .sort((a, b) => b.week - a.week)

  if (!withChallenge.length) {
    return <div className="empty">No challenge results yet. Log a match while a challenge is active.</div>
  }

  return (
    <ul className="challenge-history-list">
      {withChallenge.map(m => {
        const cr = m.challengeResult
        const challenge = findChallenge(cr.challenge_id)
        const title = challenge?.title || cr.challenge_id
        return (
          <li key={m.id} className="chl-row">
            <span className="chl-week">W{m.week}</span>
            <span className="chl-date">{m.date}</span>
            <div className="chl-info">
              <span className={`chl-diff diff-${challenge?.difficulty || 'easy'}`}>
                {challenge?.difficulty ? { easy: '🟢', medium: '🟡', hard: '🔴' }[challenge.difficulty] : '⚡'}
              </span>
              <span className="chl-title">{title}</span>
            </div>
            <div className="chl-completions">
              <span className={`chl-player ${cr.completions?.mohamed ? 'done' : 'missed'}`}>
                <span className="jersey blue" />
                {cr.completions?.mohamed ? `+${cr.points}` : '–'}
              </span>
              <span className={`chl-player ${cr.completions?.mohaned ? 'done' : 'missed'}`}>
                <span className="jersey rose" />
                {cr.completions?.mohaned ? `+${cr.points}` : '–'}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function TabButton({ id, active, onClick, icon, children }) {
  const isActive = active === id
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={isActive}
      className={`tab-btn ${isActive ? 'active' : ''}`}
      onClick={() => onClick(id)}
    >
      {icon}
      <span>{children}</span>
    </button>
  )
}

function SyncBadge({ state }) {
  const map = {
    connecting: { label: 'Connecting…', cls: 'sync-pending' },
    live:       { label: 'Live · synced', cls: 'sync-live' },
    error:      { label: 'Offline', cls: 'sync-error' },
    local:      { label: 'Local only', cls: 'sync-local' }
  }
  const m = map[state] || map.connecting
  return (
    <div className={`sync-badge ${m.cls}`}>
      <span className="sync-dot" />
      <span>{m.label}</span>
    </div>
  )
}

function readLegacy() {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return (arr || []).map(m => ({
      ...m,
      mohamed: { ...EMPTY_STATS(), ...(m.mohamed || {}) },
      mohaned: { ...EMPTY_STATS(), ...(m.mohaned || {}) },
      loggedBy: m.loggedBy || ['mohamed', 'mohaned']
    }))
  } catch {
    return []
  }
}

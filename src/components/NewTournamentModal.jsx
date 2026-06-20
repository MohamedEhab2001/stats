import { useEffect, useMemo, useState } from 'react'
import { CloseIcon, DiceIcon, PlusIcon, InfoIcon, TrophyIcon } from './Icons.jsx'
import { BADGE_KEYS, BadgeIcon, randomBadgeKey } from '../lib/badges.js'
import { randomName } from '../lib/tournamentNames.js'
import { activeBlockingCustom, todayStr } from '../lib/tournaments.js'
import { LEAGUES, LEAGUE_CATEGORIES, leagueLogoUrl, findLeague } from '../lib/leagues.js'
import LeagueLogo from './LeagueLogo.jsx'

export default function NewTournamentModal({ rows, matches, onClose, onCreate }) {
  const [closing, setClosing] = useState(false)
  const [mode, setMode] = useState('custom') // 'custom' | 'league'

  // Custom mode state
  const [name, setName] = useState(() => randomName())
  const [badgeKey, setBadgeKey] = useState(() => randomBadgeKey())
  const [customLeagueId, setCustomLeagueId] = useState(null)
  const [customLeagueCat, setCustomLeagueCat] = useState('all')

  // Make a League mode state
  const [leagueModeId, setLeagueModeId] = useState(null)
  const [leagueModeCat, setLeagueModeCat] = useState('all')

  // Shared state
  const [startDate, setStartDate] = useState(() => todayStr())
  const [matchesRequired, setMatchesRequired] = useState(10)
  const [submitting, setSubmitting] = useState(false)

  const blocker = activeBlockingCustom(rows, matches)
  const isLeagueMode = mode === 'league'

  const selectedLeague = isLeagueMode ? findLeague(leagueModeId) : null
  const disabled = !!blocker || submitting || (isLeagueMode ? !leagueModeId : !name.trim())

  const filteredCustomLeagues = useMemo(
    () => customLeagueCat === 'all' ? LEAGUES : LEAGUES.filter(l => l.category === customLeagueCat),
    [customLeagueCat]
  )
  const filteredLeagueModeLeagues = useMemo(
    () => leagueModeCat === 'all' ? LEAGUES : LEAGUES.filter(l => l.category === leagueModeCat),
    [leagueModeCat]
  )

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') doClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const doClose = () => {
    setClosing(true)
    setTimeout(() => onClose(), 140)
  }

  const submit = async (e) => {
    e?.preventDefault?.()
    if (disabled) return
    setSubmitting(true)
    try {
      if (isLeagueMode) {
        await onCreate({
          name: selectedLeague?.name || 'League Tournament',
          badge_key: 'shield-star',
          league_id: leagueModeId,
          start_date: startDate,
          matches_required: Number(matchesRequired)
        })
      } else {
        await onCreate({
          name: name.trim(),
          badge_key: badgeKey,
          league_id: customLeagueId,
          start_date: startDate,
          matches_required: Number(matchesRequired)
        })
      }
      doClose()
    } catch (err) {
      console.error(err)
      setSubmitting(false)
    }
  }

  return (
    <div className={`modal-back ${closing ? 'closing' : ''}`} onClick={doClose}>
      <div className={`modal new-tournament-modal ${closing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={doClose} aria-label="Close"><CloseIcon /></button>

        <div className="head">
          <div className="head-text">
            <h3>New custom tournament</h3>
            <div className="sub">The winner takes Golden Boot, Vision, Skills, and the title.</div>
          </div>
        </div>

        <div className="nt-mode-toggle">
          <button
            type="button"
            className={`nt-mode-btn ${mode === 'custom' ? 'active' : ''}`}
            onClick={() => setMode('custom')}
          >
            <TrophyIcon size={14} /> Custom tournament
          </button>
          <button
            type="button"
            className={`nt-mode-btn ${mode === 'league' ? 'active' : ''}`}
            onClick={() => setMode('league')}
          >
            <span className="nt-mode-badge-wrap">
              {leagueModeId
                ? <img src={leagueLogoUrl(leagueModeId)} alt="" width={14} height={14} style={{ objectFit: 'contain', verticalAlign: 'middle' }} />
                : <span style={{ fontSize: 14 }}>⚽</span>}
            </span>
            Make a League
          </button>
        </div>

        {blocker && (
          <div className="banner-error" style={{ margin: '0 0 16px' }}>
            <InfoIcon size={14} />
            <span>
              <strong>{blocker.data.name}</strong> is still active — finish or reveal it before starting a new custom tournament.
            </span>
          </div>
        )}

        <form className="new-tournament-form" onSubmit={submit}>

          {mode === 'custom' && (
            <>
              <label className="nt-row">
                <span className="nt-label">Name</span>
                <div className="nt-name">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={48}
                    placeholder="Crimson Howl"
                  />
                  <button type="button" className="nt-roll" onClick={() => setName(randomName())} title="Roll a random name">
                    <DiceIcon /> Roll
                  </button>
                </div>
              </label>

              <div className="nt-row">
                <span className="nt-label">League logo <span className="nt-opt">(optional)</span></span>
                <div className="league-cat-strip">
                  {LEAGUE_CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      className={`league-cat-btn ${customLeagueCat === cat.key ? 'active' : ''}`}
                      onClick={() => setCustomLeagueCat(cat.key)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div className="league-picker">
                  {filteredCustomLeagues.map(l => (
                    <button
                      key={l.id}
                      type="button"
                      className={`league-swatch ${customLeagueId === l.id ? 'active' : ''}`}
                      onClick={() => setCustomLeagueId(customLeagueId === l.id ? null : l.id)}
                      title={l.name}
                    >
                      <img src={leagueLogoUrl(l.id)} alt="" width={28} height={28} style={{ objectFit: 'contain' }} />
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
                {customLeagueId && (
                  <button type="button" className="league-clear" onClick={() => setCustomLeagueId(null)}>
                    × Clear league logo
                  </button>
                )}
              </div>

              <label className="nt-row">
                <span className="nt-label">Badge <span className="nt-opt">{customLeagueId ? '(overridden by league logo)' : '(fallback)'}</span></span>
                <div className="badge-picker">
                  {BADGE_KEYS.map(k => (
                    <button
                      type="button"
                      key={k}
                      className={`badge-swatch ${badgeKey === k ? 'active' : ''} ${customLeagueId ? 'dimmed' : ''}`}
                      onClick={() => setBadgeKey(k)}
                      aria-label={k}
                    >
                      <BadgeIcon badgeKey={k} size={26} />
                    </button>
                  ))}
                </div>
              </label>
            </>
          )}

          {mode === 'league' && (
            <div className="nt-row">
              <span className="nt-label">Choose a league</span>
              <div className="league-cat-strip">
                {LEAGUE_CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    type="button"
                    className={`league-cat-btn ${leagueModeCat === cat.key ? 'active' : ''}`}
                    onClick={() => setLeagueModeCat(cat.key)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="league-picker league-picker-lg">
                {filteredLeagueModeLeagues.map(l => (
                  <button
                    key={l.id}
                    type="button"
                    className={`league-swatch ${leagueModeId === l.id ? 'active' : ''}`}
                    onClick={() => setLeagueModeId(leagueModeId === l.id ? null : l.id)}
                    title={l.name}
                  >
                    <img src={leagueLogoUrl(l.id)} alt="" width={34} height={34} style={{ objectFit: 'contain' }} />
                    <span>{l.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="nt-row nt-row-grid">
            <label>
              <span className="nt-label">Start date</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </label>
            <label>
              <span className="nt-label">Matches required</span>
              <div className="nt-matches">
                <input
                  type="range"
                  min={2}
                  max={38}
                  value={matchesRequired}
                  onChange={e => setMatchesRequired(e.target.value)}
                />
                <span className="nt-matches-val">{matchesRequired}</span>
              </div>
            </label>
          </div>

          <div className="form-foot">
            <div className="meta">
              {isLeagueMode ? (
                leagueModeId
                  ? <img src={leagueLogoUrl(leagueModeId)} alt="" width={22} height={22} style={{ objectFit: 'contain' }} />
                  : <span style={{ fontSize: 22 }}>⚽</span>
              ) : (
                <LeagueLogo leagueId={customLeagueId} badgeKey={badgeKey} size={22} />
              )}
              <div>
                <div>
                  <strong>
                    {isLeagueMode
                      ? (selectedLeague?.name || 'Pick a league above')
                      : (name || 'Unnamed tournament')}
                  </strong>
                </div>
                <div className="sub">{matchesRequired} matches from {startDate}</div>
              </div>
            </div>
            <button className="submit" type="submit" disabled={disabled}>
              <PlusIcon size={14} /> {submitting ? 'Creating…' : isLeagueMode ? 'Create league' : 'Create tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

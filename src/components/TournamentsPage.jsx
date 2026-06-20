import { useMemo, useState } from 'react'
import { PlusIcon, TrophyIcon, CalendarIcon, InfoIcon } from './Icons.jsx'
import TournamentCard from './TournamentCard.jsx'
import TournamentDetail from './TournamentDetail.jsx'
import TrophyCabinet from './TrophyCabinet.jsx'
import NewTournamentModal from './NewTournamentModal.jsx'
import {
  listTournaments, findTournament, monthKey, yearKey, todayStr,
  activeBlockingCustom, tournamentStatus
} from '../lib/tournaments.js'

export default function TournamentsPage({ matches, tournaments, onCreate, onReveal, revealingKey, onDeleteTournament }) {
  const [openKey, setOpenKey] = useState(null)
  const [creating, setCreating] = useState(false)

  const today = todayStr()
  const currentMonthKey = `monthly-${monthKey(today)}`
  const currentYearKey = `yearly-${yearKey(today)}`

  const monthlyRow = useMemo(() => findTournament(tournaments, currentMonthKey), [tournaments, currentMonthKey])
  const yearlyRow = useMemo(() => findTournament(tournaments, currentYearKey), [tournaments, currentYearKey])
  const liveCustom = useMemo(() => activeBlockingCustom(tournaments, matches, today), [tournaments, matches, today])
  const sorted = useMemo(() => listTournaments(tournaments, matches, today), [tournaments, matches, today])

  const openRow = openKey ? findTournament(tournaments, openKey) : null

  const finishedRevealable = useMemo(
    () => tournaments.filter(r => ['monthly','yearly','custom'].includes(r.data?.kind) && tournamentStatus(r, matches, today) === 'finished' && !r.data.revealed).length,
    [tournaments, matches, today]
  )

  return (
    <>
      {liveCustom && (
        <section className="section live-custom-banner">
          <div className="lcb-mark"><TrophyIcon size={14} /></div>
          <div className="lcb-text">
            <strong>{liveCustom.data.name}</strong> is live
            <span className="sub"> · custom tournament in progress</span>
          </div>
          <button className="lcb-open" onClick={() => setOpenKey(liveCustom.key)}>Open</button>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <div className="left">
            <div className="icon-wrap"><CalendarIcon size={16} /></div>
            <div>
              <h2>This month</h2>
              <div className="sub">Auto-tournament for the current calendar month · finalises when the month ends</div>
            </div>
          </div>
        </div>
        {monthlyRow ? (
          <div className="tournament-feature">
            <TournamentCard row={monthlyRow} matches={matches} onOpen={setOpenKey} />
          </div>
        ) : (
          <div className="empty">
            <InfoIcon size={14} />
            <span>The monthly tournament appears once the first match of the month is logged.</span>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div className="left">
            <div className="icon-wrap"><TrophyIcon size={16} /></div>
            <div>
              <h2>This year</h2>
              <div className="sub">Year-long season · accumulates every match logged this year</div>
            </div>
          </div>
        </div>
        {yearlyRow ? (
          <div className="tournament-feature">
            <TournamentCard row={yearlyRow} matches={matches} onOpen={setOpenKey} />
          </div>
        ) : (
          <div className="empty">
            <InfoIcon size={14} />
            <span>The yearly tournament starts when the first match of the year is logged.</span>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div className="left">
            <div className="icon-wrap"><TrophyIcon size={16} /></div>
            <div>
              <h2>All tournaments</h2>
              <div className="sub">
                {tournaments.length} total
                {finishedRevealable > 0 && ` · ${finishedRevealable} ready to reveal`}
              </div>
            </div>
          </div>
          <button className="add-btn" onClick={() => setCreating(true)}>
            <PlusIcon size={14} /> New custom tournament
          </button>
        </div>
        {sorted.length === 0 ? (
          <div className="empty">No tournaments yet — log a match to spawn the monthly + yearly, or create a custom one.</div>
        ) : (
          <div className="tournament-grid">
            {sorted.map(({ row }) => (
              <TournamentCard key={row.key} row={row} matches={matches} onOpen={setOpenKey} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div className="left">
            <div className="icon-wrap"><TrophyIcon size={16} /></div>
            <div>
              <h2>Trophy cabinet</h2>
              <div className="sub">Medals collected from every revealed tournament · lifetime</div>
            </div>
          </div>
        </div>
        <TrophyCabinet rows={tournaments} />
      </section>

      {openRow && (
        <TournamentDetail
          row={openRow}
          matches={matches}
          onClose={() => setOpenKey(null)}
          onReveal={onReveal}
          revealing={revealingKey === openRow.key}
          onDelete={onDeleteTournament}
        />
      )}

      {creating && (
        <NewTournamentModal
          rows={tournaments}
          matches={matches}
          onClose={() => setCreating(false)}
          onCreate={onCreate}
        />
      )}
    </>
  )
}

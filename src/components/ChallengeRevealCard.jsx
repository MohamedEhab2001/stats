import { useEffect, useRef, useState } from 'react'
import { CHALLENGES, DIFF_EMOJI, DIFF_LABEL } from '../lib/challenges.js'
import { setActiveChallenge } from '../lib/api.js'

export default function ChallengeRevealCard({ activeChallenge, matches, onChallengeChange }) {
  const [phase, setPhase] = useState('idle') // idle | spinning | revealed
  const [displayed, setDisplayed] = useState(null) // challenge shown during spin / after reveal
  const intervalRef = useRef(null)

  const activeId = activeChallenge?.challenge_id
  const activeChallengeFull = activeId ? CHALLENGES.find(c => c.id === activeId) : null

  // canReveal: no active challenge OR active challenge completed by at least 1 player in ≥1 match
  const completedInAMatch = !!activeId && matches.some(m =>
    m.challengeResult?.challenge_id === activeId &&
    (m.challengeResult?.completions?.mohamed || m.challengeResult?.completions?.mohaned)
  )
  const isBlocked = !!activeId && !completedInAMatch
  const canReveal = !isBlocked

  // Reset to idle when active challenge disappears (cleared externally)
  useEffect(() => {
    if (!activeId && phase !== 'idle') {
      setPhase('idle')
      setDisplayed(null)
    }
  }, [activeId])

  // Cleanup interval on unmount
  useEffect(() => () => clearInterval(intervalRef.current), [])

  const handleReveal = async () => {
    if (!canReveal || phase === 'spinning') return

    // Pick a random challenge, avoid repeating the just-active one
    const pool = activeId ? CHALLENGES.filter(c => c.id !== activeId) : CHALLENGES
    const pick = pool[Math.floor(Math.random() * pool.length)]

    setPhase('spinning')

    // Slot-machine: flash random challenges, slow to a stop on `pick`
    const TOTAL_TICKS = 22
    let tick = 0
    intervalRef.current = setInterval(() => {
      tick++
      if (tick < TOTAL_TICKS) {
        // Speed slows down in last 6 ticks
        const slow = tick > TOTAL_TICKS - 6
        if (!slow || tick % 2 === 0) {
          setDisplayed(CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)])
        }
      } else {
        clearInterval(intervalRef.current)
        setDisplayed(pick)
        setPhase('revealed')
        setActiveChallenge(pick.id)
          .then(() => onChallengeChange({ challenge_id: pick.id }))
          .catch(e => console.error('set challenge failed', e))
      }
    }, 80)
  }

  return (
    <div className={`crc-card ${isBlocked ? 'crc-blocked-state' : ''} ${phase === 'revealed' ? 'crc-done' : ''}`}>
      <div className="crc-header">
        <span className="crc-label">
          {isBlocked ? '🔒 Locked' : '🎲 Challenge Reveal'}
        </span>
        {completedInAMatch && (
          <span className="crc-completed-tag">✓ Last challenge completed</span>
        )}
      </div>

      <div className="crc-body">
        {isBlocked ? (
          <div className="crc-lock-body">
            <div className="crc-lock-icon">🔒</div>
            <div className="crc-lock-title">
              &ldquo;{activeChallengeFull?.title ?? 'Current challenge'}&rdquo; is still active
            </div>
            <div className="crc-lock-sub">
              Complete it in a match, or remove it to unlock the next reveal
            </div>
          </div>
        ) : phase === 'idle' ? (
          <div className="crc-idle-body">
            <div className="crc-slots">
              <div className="crc-slot">?</div>
              <div className="crc-slot">?</div>
              <div className="crc-slot">?</div>
            </div>
            <div className="crc-idle-hint">
              {completedInAMatch
                ? 'Nice work — spin for the next challenge!'
                : 'Spin to reveal this week\'s challenge'}
            </div>
          </div>
        ) : (
          <div className={`crc-spin-body ${phase === 'spinning' ? 'is-spinning' : 'is-landed'}`}>
            {displayed && (
              <>
                <div className="crc-spin-diff-row">
                  <span className={`crc-spin-diff diff-${displayed.difficulty}`}>
                    {DIFF_EMOJI[displayed.difficulty]} {DIFF_LABEL[displayed.difficulty]}
                  </span>
                  <span className="crc-spin-pts">+{displayed.points} pts</span>
                </div>
                <div className="crc-spin-title">{displayed.title}</div>
                {phase === 'revealed' && (
                  <div className="crc-spin-desc">{displayed.description}</div>
                )}
              </>
            )}
            {phase === 'revealed' && (
              <div className="crc-success-badge">✨ Challenge set — good luck!</div>
            )}
          </div>
        )}
      </div>

      <div className="crc-footer">
        <button
          type="button"
          className={`crc-btn ${isBlocked ? 'crc-btn-locked' : phase === 'spinning' ? 'crc-btn-spinning' : ''}`}
          onClick={handleReveal}
          disabled={isBlocked || phase === 'spinning'}
        >
          {isBlocked
            ? '🔒 Locked'
            : phase === 'spinning'
            ? '🎲 Spinning…'
            : phase === 'revealed'
            ? '🎲 Spin again'
            : '🎲 Reveal Challenge'}
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { CHALLENGES, DIFF_EMOJI, DIFF_LABEL, DIFF_POINTS } from '../lib/challenges.js'
import { clearActiveChallenge } from '../lib/api.js'
import ChallengePickerModal from './ChallengePickerModal.jsx'

const STAT_EMOJI = {
  goals: '⚽', assists: '👟', dribbles: '🕺', sot: '🎯',
  soff: '💨', possession: '🛡️', combined: '⚡', outcome: '🏆',
  streak: '🔥', special: '🌟'
}

// completedByPlayer: { ch-001: ['mohamed', 'mohaned'], ... }  derived from matches
export default function WeeklyChallengeCard({ activeChallenge, matches, onChallengeChange }) {
  const [showPicker, setShowPicker] = useState(false)
  const [clearing, setClearing] = useState(false)

  const challenge = activeChallenge?.challenge_id
    ? CHALLENGES.find(c => c.id === activeChallenge.challenge_id)
    : null

  // Compute who completed it this week from matches
  const completionsByMatch = matches
    .filter(m => m.challengeResult?.challenge_id && m.challengeResult.challenge_id === activeChallenge?.challenge_id)
    .map(m => ({
      week: m.week,
      date: m.date,
      completions: m.challengeResult?.completions || {}
    }))

  const totalMohamed = completionsByMatch.filter(r => r.completions.mohamed).length
  const totalMohaned = completionsByMatch.filter(r => r.completions.mohaned).length

  const handleClear = async () => {
    setClearing(true)
    try {
      await clearActiveChallenge()
      onChallengeChange(null)
    } catch (e) {
      console.error('clear challenge failed', e)
    } finally {
      setClearing(false)
    }
  }

  return (
    <>
      <div className="wcc-card">
        <div className="wcc-header">
          <span className="wcc-title-label">⚡ Weekly Challenge</span>
          <div className="wcc-header-actions">
            <button
              type="button"
              className="wcc-change-btn"
              onClick={() => setShowPicker(true)}
            >
              {challenge ? 'Change' : 'Set challenge'}
            </button>
            {challenge && (
              <button
                type="button"
                className="wcc-clear-btn"
                onClick={handleClear}
                disabled={clearing}
              >
                {clearing ? '…' : '× Clear'}
              </button>
            )}
          </div>
        </div>

        {challenge ? (
          <div className="wcc-body">
            <div className="wcc-diff-row">
              <span className={`wcc-diff-badge diff-${challenge.difficulty}`}>
                {DIFF_EMOJI[challenge.difficulty]} {DIFF_LABEL[challenge.difficulty]}
              </span>
              <span className="wcc-points">+{challenge.points} pts</span>
              <span className="wcc-stat-tag">{STAT_EMOJI[challenge.stat]} {challenge.stat.charAt(0).toUpperCase() + challenge.stat.slice(1)}</span>
            </div>

            <div className="wcc-challenge-title">{challenge.title}</div>
            <div className="wcc-challenge-desc">{challenge.description}</div>

            <div className="wcc-completions">
              <div className="wcc-player-status">
                <span className={`jersey blue`} />
                <span className="wcc-player-name">Mohamed</span>
                <span className={`wcc-status-pip ${totalMohamed > 0 ? 'done' : 'pending'}`}>
                  {totalMohamed > 0 ? `✓ ×${totalMohamed}` : '–'}
                </span>
              </div>
              <div className="wcc-player-status">
                <span className={`jersey rose`} />
                <span className="wcc-player-name">Mohaned</span>
                <span className={`wcc-status-pip ${totalMohaned > 0 ? 'done' : 'pending'}`}>
                  {totalMohaned > 0 ? `✓ ×${totalMohaned}` : '–'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="wcc-empty">
            <div className="wcc-empty-icon">🎯</div>
            <div className="wcc-empty-text">No active challenge this week</div>
            <div className="wcc-empty-sub">Set one and earn bonus points when you complete it</div>
          </div>
        )}
      </div>

      {showPicker && (
        <ChallengePickerModal
          activeId={activeChallenge?.challenge_id || null}
          onClose={() => setShowPicker(false)}
          onSelect={(challenge) => {
            setShowPicker(false)
            onChallengeChange({ challenge_id: challenge.id })
          }}
        />
      )}
    </>
  )
}

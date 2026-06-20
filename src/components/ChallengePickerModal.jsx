import { useEffect, useMemo, useState } from 'react'
import { CHALLENGES, DIFF_EMOJI, DIFF_LABEL, STAT_LABELS, DIFF_POINTS } from '../lib/challenges.js'
import { setActiveChallenge } from '../lib/api.js'
import { CloseIcon } from './Icons.jsx'

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard']
const STATS = ['all', 'goals', 'assists', 'dribbles', 'sot', 'soff', 'possession', 'combined', 'outcome', 'streak', 'special']

export default function ChallengePickerModal({ activeId, onClose, onSelect }) {
  const [diff, setDiff] = useState('all')
  const [stat, setStat] = useState('all')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(null) // challenge id being saved

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = useMemo(() => {
    let list = CHALLENGES
    if (diff !== 'all') list = list.filter(c => c.difficulty === diff)
    if (stat !== 'all') list = list.filter(c => c.stat === stat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      )
    }
    return list
  }, [diff, stat, search])

  const handleSelect = async (challenge) => {
    setSaving(challenge.id)
    try {
      await setActiveChallenge(challenge.id)
      onSelect(challenge)
    } catch (e) {
      console.error('set challenge failed', e)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal challenge-picker-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        <h3>Pick a Challenge</h3>
        <div className="sub">Choose the active challenge for this week — players earn bonus points on completion</div>

        <div className="cpm-filters">
          <input
            className="cpm-search"
            placeholder="Search challenges…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div className="cpm-filter-row">
            <div className="cpm-filter-group">
              <span className="cpm-filter-label">Difficulty</span>
              <div className="cpm-chip-row">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    type="button"
                    className={`cpm-chip ${diff === d ? 'active' : ''} ${d !== 'all' ? `chip-${d}` : ''}`}
                    onClick={() => setDiff(d)}
                  >
                    {d === 'all' ? 'All' : `${DIFF_EMOJI[d]} ${DIFF_LABEL[d]}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="cpm-filter-group">
              <span className="cpm-filter-label">Category</span>
              <div className="cpm-chip-row">
                {STATS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`cpm-chip ${stat === s ? 'active' : ''}`}
                    onClick={() => setStat(s)}
                  >
                    {s === 'all' ? 'All' : (STAT_LABELS[s] || s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="cpm-count">{filtered.length} challenge{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        <div className="cpm-list">
          {filtered.length === 0 ? (
            <div className="cpm-empty">No challenges match your filters</div>
          ) : filtered.map(c => {
            const isActive = c.id === activeId
            const isSaving = saving === c.id
            return (
              <div key={c.id} className={`cpm-row ${isActive ? 'is-active' : ''}`}>
                <div className="cpm-row-left">
                  <div className="cpm-row-top">
                    <span className={`cpm-diff-badge diff-${c.difficulty}`}>
                      {DIFF_EMOJI[c.difficulty]} {DIFF_LABEL[c.difficulty]}
                    </span>
                    <span className="cpm-pts">+{c.points} pts</span>
                    {isActive && <span className="cpm-active-tag">Active</span>}
                  </div>
                  <div className="cpm-row-title">{c.title}</div>
                  <div className="cpm-row-desc">{c.description}</div>
                </div>
                <button
                  type="button"
                  className={`cpm-set-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleSelect(c)}
                  disabled={!!saving || isActive}
                >
                  {isSaving ? '…' : isActive ? 'Active' : 'Set'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

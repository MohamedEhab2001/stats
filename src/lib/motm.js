// Man of the Match — distinct from p-index:
// Uses ratios (shot accuracy), contextual bonuses (clean sheet, result),
// and category weighting that differs from the stat-weight system in stats.js.

const NAMES = { mohamed: 'Mohamed', mohaned: 'Mohaned' }

function shotAcc(s) {
  const t = s.shotsOnTarget + s.shotsOffTarget
  return t > 0 ? s.shotsOnTarget / t : 0
}

function motmScore(s, opp) {
  const acc = shotAcc(s)
  const totalShots = s.shotsOnTarget + s.shotsOffTarget
  return (
    s.goals        * 5   +
    s.assists      * 3   +
    acc            * 8   +   // accuracy ratio, not raw shot count
    s.dribbles     * 1.2 +
    s.possessionWon * 1.4 +
    (opp.goals === 0 ? 6 : 0) +   // clean sheet bonus
    (s.goals > opp.goals ? 5 : s.goals === opp.goals ? 1 : 0)  // result bonus
  )
}

function buildReasons(ws, os, winnerKey) {
  const candidates = []

  // Goal involvement — always lead if present
  const hasGoalInvolv = ws.goals > 0 || ws.assists > 0
  if (hasGoalInvolv) {
    const parts = []
    if (ws.goals > 0) parts.push(`${ws.goals} goal${ws.goals !== 1 ? 's' : ''}`)
    if (ws.assists > 0) parts.push(`${ws.assists} assist${ws.assists !== 1 ? 's' : ''}`)
    candidates.push({ priority: 0, text: parts.join(' + ') })
  }

  // Shot accuracy
  const wAcc = shotAcc(ws), oAcc = shotAcc(os)
  const wShots = ws.shotsOnTarget + ws.shotsOffTarget
  if (wShots >= 2 && wAcc > oAcc + 0.15) {
    candidates.push({
      priority: 1,
      text: `${Math.round(wAcc * 100)}% shot accuracy — clinical in front of goal`
    })
  }

  // Dribbles
  if (ws.dribbles >= 3 && ws.dribbles > os.dribbles) {
    candidates.push({
      priority: 2,
      text: `Dominated 1-v-1s with ${ws.dribbles} successful dribbles`
    })
  }

  // Possession won
  if (ws.possessionWon >= 5 && ws.possessionWon > os.possessionWon + 2) {
    candidates.push({
      priority: 3,
      text: `Won the midfield battle — ${ws.possessionWon} possession recoveries`
    })
  }

  // Clean sheet
  if (os.goals === 0) {
    candidates.push({
      priority: 4,
      text: ws.goals > os.goals ? 'Won to nil — a complete team performance' : 'Kept a clean sheet'
    })
  }

  // Scoreline
  if (ws.goals > os.goals) {
    candidates.push({ priority: 5, text: `Won ${ws.goals}–${os.goals}` })
  }

  // Fallback
  if (candidates.length === 0) {
    candidates.push({ priority: 99, text: 'Outperformed across multiple stat categories' })
  }

  // Sort by priority, return top 3
  candidates.sort((a, b) => a.priority - b.priority)
  return candidates.slice(0, 3).map(c => c.text)
}

export function computeMOTM(match) {
  const m = match.mohamed
  const n = match.mohaned

  const scoreM = motmScore(m, n)
  const scoreN = motmScore(n, m)
  const gap = scoreM - scoreN

  // Ties within 2 points of each other
  const winner = Math.abs(gap) < 2 ? 'tie' : (gap > 0 ? 'mohamed' : 'mohaned')

  let reasons
  if (winner === 'tie') {
    reasons = [
      'Equally matched — stats too close to separate',
      m.goals === n.goals
        ? `Both scored ${m.goals} goal${m.goals !== 1 ? 's' : ''} — a shared performance`
        : 'Different strengths, same overall impact'
    ]
  } else {
    const ws = winner === 'mohamed' ? m : n
    const os = winner === 'mohamed' ? n : m
    reasons = buildReasons(ws, os, winner)
  }

  return {
    winner,
    scores: {
      mohamed: Math.round(scoreM * 10) / 10,
      mohaned: Math.round(scoreN * 10) / 10
    },
    reasons
  }
}

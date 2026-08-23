// Fun, deliberately-approximate xG + "FIFA card" rating — not a rigorous analytics model. Real
// xG needs shot location; all we track is on/off-target counts, so this is a proxy. Pure
// functions, no DB imports, same convention as the rest of lib/stats-engine/*.
//
// Every attribute is derived purely from logged match stats — there is no self-rating or manual
// input anywhere on this card. That's a deliberate product decision: the card is a trophy you
// earn, not a form you fill in.

export type ClinicalTier = 'clinical' | 'normal' | 'wasteful' | 'unrated'
export type CardPosition = 'ST' | 'CAM' | 'CM' | 'CB'

export type FifaCardInputs = {
  played: number
  totals: Record<string, number> // aggregated across played weeks, keyed by stat key
}

export type FifaCard = {
  xG: number
  clinicalIndex: number | null
  clinicalTier: ClinicalTier
  provisional: boolean // fewer than 3 played weeks — still shown, just caveated in the UI
  attributes: { PAC: number; SHO: number; PAS: number; DRI: number; DEF: number; PHY: number }
  ovr: number
  position: CardPosition
}

export const MIN_WEEKS_FOR_CONFIDENT_CARD = 3

function clamp(value: number, min = 1, max = 99): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

/** Proxy xG: real xG needs shot distance/angle; this is directionally-correct only. */
export function computeXG(shotsOnTarget: number, shotsOffTarget: number): number {
  return shotsOnTarget * 0.35 + shotsOffTarget * 0.05
}

/** Actual goals ÷ xG. >1.2 = clinical finisher, 0.8-1.2 = normal, <0.8 = wasteful. */
export function computeClinicalIndex(goals: number, xG: number): { index: number | null; tier: ClinicalTier } {
  if (xG <= 0) return { index: null, tier: 'unrated' }
  const index = Math.round((goals / xG) * 100) / 100
  const tier: ClinicalTier = index > 1.2 ? 'clinical' : index < 0.8 ? 'wasteful' : 'normal'
  return { index, tier }
}

/** Cosmetic role label — whichever of the four skill attributes leads decides the "position"
 * badge, the same way a FUT card's position hints at a player's strength. Not a rigorous
 * classifier, just a fun read at a glance. */
function derivePosition(attributes: { SHO: number; PAS: number; DRI: number; DEF: number }): CardPosition {
  const ranked: [CardPosition, number][] = [
    ['ST', attributes.SHO],
    ['CAM', attributes.DRI],
    ['CM', attributes.PAS],
    ['CB', attributes.DEF]
  ]
  ranked.sort((a, b) => b[1] - a[1])
  return ranked[0][0]
}

export function computeFifaCard({ played, totals }: FifaCardInputs): FifaCard {
  const perGame = (key: string) => (played > 0 ? (totals[key] || 0) / played : 0)

  const goalsPerGame = perGame('goals')
  const assistsPerGame = perGame('assists')
  const dribblesPerGame = perGame('dribbles')
  const possessionWonPerGame = perGame('possessionWon')
  const shotsOnTargetPerGame = perGame('shotsOnTarget')

  const xG = computeXG(totals.shotsOnTarget || 0, totals.shotsOffTarget || 0)
  const { index: clinicalIndex, tier: clinicalTier } = computeClinicalIndex(totals.goals || 0, xG)
  // A clinical finisher gets rewarded twice: goals/game feeds SHO directly, and a high
  // clinical index (more goals than shots "deserved") adds on top of that.
  const clinicalBonus = clinicalIndex ?? 1

  const attributes = {
    SHO: clamp(30 + goalsPerGame * 25 + clinicalBonus * 5),
    PAS: clamp(35 + assistsPerGame * 35),
    DRI: clamp(30 + dribblesPerGame * 7),
    DEF: clamp(20 + possessionWonPerGame * 2.5),
    // Tempo of play: how often the player runs at goal and gets a shot away.
    PAC: clamp(25 + dribblesPerGame * 3 + shotsOnTargetPerGame * 4),
    // Physical duels won, plus a durability bonus for actually showing up week after week.
    PHY: clamp(25 + possessionWonPerGame * 1.8 + played * 1.2)
  }

  const ovr = clamp(
    attributes.SHO * 0.3 +
      attributes.PAS * 0.2 +
      attributes.DRI * 0.2 +
      attributes.DEF * 0.15 +
      attributes.PAC * 0.1 +
      attributes.PHY * 0.05
  )

  return {
    xG: Math.round(xG * 100) / 100,
    clinicalIndex,
    clinicalTier,
    provisional: played < MIN_WEEKS_FOR_CONFIDENT_CARD,
    attributes,
    ovr,
    position: derivePosition(attributes)
  }
}

import type { FifaCard, ClinicalTier } from '@/lib/stats-engine/fifaCard'

// Shared "player card" visual, used by both the Scouting page (every member) and the Compare
// page (the two picked members). Server-renderable — no hooks, no client interactivity, so it's
// imported directly from server components. Every number on it is computed straight from logged
// match stats (see lib/stats-engine/fifaCard.ts) — there is nothing here for a member to edit.
//
// The shareable PNG version of this same card lives in
// app/api/spaces/[spaceId]/fifa-card/[userId]/image/route.ts. Satori (which renders that PNG)
// only understands inline styles, not Tailwind classes, so that route re-implements this layout
// with plain style objects rather than importing this component. Keep the two in sync visually
// when you change one.

const TIER_EMOJI: Record<ClinicalTier, string> = {
  clinical: '\u{1F525}', // 🔥
  normal: '✅',
  wasteful: '\u{1F62C}', // 😬
  unrated: ''
}

type CardTier = 'gold' | 'silver' | 'bronze'

function tierFor(ovr: number): CardTier {
  if (ovr >= 80) return 'gold'
  if (ovr >= 65) return 'silver'
  return 'bronze'
}

const TIER_STYLES: Record<CardTier, { border: string; bg: string; ovr: string; rail: string }> = {
  gold: {
    border: 'border-gold/60',
    bg: 'bg-gradient-to-b from-gold-dim via-transparent to-transparent',
    ovr: 'text-gold',
    rail: 'bg-gold'
  },
  silver: {
    border: 'border-neutral-300 dark:border-neutral-600',
    bg: 'bg-gradient-to-b from-neutral-200/60 via-transparent to-transparent dark:from-neutral-700/40',
    ovr: 'text-neutral-700 dark:text-neutral-200',
    rail: 'bg-neutral-400 dark:bg-neutral-500'
  },
  bronze: {
    border: 'border-amber-800/40 dark:border-amber-700/40',
    bg: 'bg-gradient-to-b from-amber-900/10 via-transparent to-transparent',
    ovr: 'text-amber-800 dark:text-amber-500',
    rail: 'bg-amber-700 dark:bg-amber-600'
  }
}

const ATTRIBUTE_KEYS: (keyof FifaCard['attributes'])[] = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY']

export default function FifaCardView({
  card,
  nickname,
  tierLabels,
  xgLabel,
  provisionalNote
}: {
  card: FifaCard
  nickname: string
  tierLabels: Record<ClinicalTier, string>
  xgLabel: string
  provisionalNote?: string
}) {
  const tier = tierFor(card.ovr)
  const styles = TIER_STYLES[tier]
  const tierEmoji = TIER_EMOJI[card.clinicalTier]
  const clinicalLabel = card.clinicalTier === 'unrated' ? null : tierLabels[card.clinicalTier]

  return (
    <div
      className={`relative mx-auto flex w-full max-w-[260px] flex-col gap-4 overflow-hidden rounded-2xl border p-4 shadow-sm ${styles.border} ${styles.bg}`}
    >
      {/* Foil shine — pure CSS, no image asset needed. */}
      <div className="pointer-events-none absolute -inset-x-10 -top-24 h-40 rotate-12 bg-gradient-to-b from-white/25 to-transparent dark:from-white/10" />

      <div className="relative flex items-start justify-between">
        <div className="flex flex-col leading-none" dir="ltr">
          <span className={`text-4xl font-black ${styles.ovr}`}>{card.ovr}</span>
          <span className="mt-1 text-xs font-bold tracking-wide text-neutral-500">{card.position}</span>
        </div>
        {clinicalLabel && (
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium dark:bg-neutral-900/80">
            {tierEmoji} {clinicalLabel}
          </span>
        )}
      </div>

      <div className="relative flex flex-col items-center gap-1 border-y border-dashed border-neutral-200 py-2 text-center dark:border-neutral-800">
        <span className={`h-0.5 w-10 rounded-full ${styles.rail}`} />
        <span className="truncate text-base font-bold uppercase tracking-wide">{nickname}</span>
      </div>

      <div className="relative grid grid-cols-2 gap-x-3 gap-y-2">
        {ATTRIBUTE_KEYS.map((key) => {
          const value = card.attributes[key]
          return (
            <div key={key} className="flex items-center gap-2 text-xs" dir="ltr">
              <span className="w-7 shrink-0 font-bold text-neutral-500">{key}</span>
              <span className="w-6 shrink-0 text-end font-semibold">{value}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <span
                  className={`block h-full rounded-full ${styles.rail}`}
                  style={{ width: `${Math.min(100, (value / 99) * 100)}%` }}
                />
              </span>
            </div>
          )
        })}
      </div>

      <p className="relative text-center text-xs text-neutral-500">
        {xgLabel}: <span dir="ltr">{card.xG}</span>
      </p>

      {card.provisional && provisionalNote && (
        <p className="relative text-center text-xs text-neutral-500">{provisionalNote}</p>
      )}
    </div>
  )
}

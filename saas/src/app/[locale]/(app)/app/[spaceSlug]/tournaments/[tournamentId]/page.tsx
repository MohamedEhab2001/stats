import { notFound } from 'next/navigation'
import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { listMembers } from '@/lib/services/memberships'
import { getTournamentForSpace } from '@/lib/services/tournaments'
import { ServiceError } from '@/lib/services/errors'
import { PRIZE_META, monthLabel } from '@/lib/stats-engine/tournaments'
import { BadgeIcon } from '@/lib/domain/badges'
import { findLeague, leagueLogoUrl } from '@/lib/domain/leagues'
import { LocaleLink } from '@/i18n/navigation'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import RevealButton from '../RevealButton'

const STATUS_STYLES: Record<string, string> = {
  upcoming: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400',
  live: 'bg-green-600/15 text-green-700 dark:text-green-400',
  finished: 'bg-gold-dim text-gold'
}

const PRIZE_EMOJI: Record<string, string> = {
  goldenBoot: '⚽',
  goldenVision: '🎯',
  goldenSkills: '✨',
  winner: '🏆',
  playerOfMonth: '⭐'
}

export default async function TournamentDetailPage({
  params
}: {
  params: Promise<{ locale: string; spaceSlug: string; tournamentId: string }>
}) {
  const { locale: rawLocale, spaceSlug, tournamentId } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { space } = await requireSpaceMembership(locale, spaceSlug)
  const spaceId = String(space._id)

  const tournament = await getTournamentForSpace(spaceId, tournamentId).catch((err) => {
    if (err instanceof ServiceError && err.status === 404) return null
    throw err
  })
  if (!tournament) notFound()

  const members = await listMembers(spaceId)
  const nameById = new Map(members.map((m) => [m.userId, m.nickname]))
  const league = findLeague(tournament.leagueId)
  const progressPct =
    tournament.progress.total && tournament.progress.total > 0
      ? Math.min(100, (tournament.progress.current / tournament.progress.total) * 100)
      : null

  return (
    <div className="flex flex-col gap-6">
      <LocaleLink
        href={`/app/${spaceSlug}/tournaments`}
        className="w-fit text-sm text-neutral-500 hover:underline"
      >
        &larr; {t('app:tournaments.detail.back')}
      </LocaleLink>

      <div className="overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-gold-dim to-transparent p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-900/5 text-gold dark:bg-white/5">
            <BadgeIcon badgeKey={tournament.badgeKey} size={36} />
          </span>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{tournament.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
              <span>{t(`app:tournaments.kind.${tournament.kind}`)}</span>
              {tournament.kind === 'monthly' && <span>· {monthLabel(tournament.monthKey ?? '')}</span>}
              {tournament.kind === 'yearly' && <span>· {tournament.year}</span>}
              {tournament.kind === 'custom' && (
                <span>· {t('app:tournaments.startsOn', { date: tournament.startDate })}</span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[tournament.status]}`}>
                {t(`app:tournaments.status.${tournament.status}`)}
              </span>
            </p>
          </div>
          {league && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={leagueLogoUrl(league.id)} alt={league.name} className="h-14 w-14 shrink-0 object-contain" />
          )}
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <p className="text-sm text-neutral-500" dir="ltr">
            {tournament.progress.label}
          </p>
          {progressPct !== null && (
            <span className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-neutral-900/10 dark:bg-white/10">
              <span className="block h-full rounded-full bg-gold" style={{ width: `${Math.max(2, progressPct)}%` }} />
            </span>
          )}
        </div>
      </div>

      {tournament.status === 'finished' && !tournament.revealed && (
        <RevealButton spaceId={spaceId} tournamentId={tournamentId} />
      )}

      {tournament.revealed && tournament.results ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(tournament.results.prizes).map(([key, prize]) => {
            return (
              <div
                key={key}
                className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-dim text-lg">
                    {PRIZE_EMOJI[key]}
                  </span>
                  <h2 className="font-semibold">{PRIZE_META[key as keyof typeof PRIZE_META]?.label ?? key}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {prize.winners.map((w) => {
                    const name = nameById.get(w) ?? w
                    return (
                      <span
                        key={w}
                        className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold-dim px-3 py-1"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-ink">
                          {name.trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gold">{name}</span>
                      </span>
                    )
                  })}
                </div>

                <p className="text-xs text-neutral-500" dir="ltr">
                  {prize.why}
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">{t('app:tournaments.detail.notRevealedYet')}</p>
      )}
    </div>
  )
}

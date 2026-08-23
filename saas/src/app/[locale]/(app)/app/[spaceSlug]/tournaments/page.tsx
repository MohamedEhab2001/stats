import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { listMembers } from '@/lib/services/memberships'
import { ensureCalendarTournaments, listTournamentsForSpace } from '@/lib/services/tournaments'
import { todayStr, monthLabel, PRIZE_META } from '@/lib/stats-engine/tournaments'
import { BadgeIcon } from '@/lib/domain/badges'
import { findLeague, leagueLogoUrl } from '@/lib/domain/leagues'
import { LocaleLink } from '@/i18n/navigation'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import RevealButton from './RevealButton'
import CreateTournamentForm from './CreateTournamentForm'
import EditTournamentForm from './EditTournamentForm'

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

export default async function TournamentsPage({
  params
}: {
  params: Promise<{ locale: string; spaceSlug: string }>
}) {
  const { locale: rawLocale, spaceSlug } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { space, membership } = await requireSpaceMembership(locale, spaceSlug)
  const spaceId = String(space._id)
  const isOwner = membership.role === 'owner'

  await ensureCalendarTournaments(spaceId, todayStr())
  const { tournaments, canCreateCustom, blockingCustom } = await listTournamentsForSpace(spaceId)
  const members = await listMembers(spaceId)
  const nameById = new Map(members.map((m) => [m.userId, m.nickname]))

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">{t('app:tournaments.title')}</h1>

      {isOwner && (
        <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-lg font-medium">{t('app:tournaments.customHeading')}</h2>
          {canCreateCustom ? (
            <CreateTournamentForm spaceId={spaceId} />
          ) : (
            <p className="text-sm text-neutral-500">
              {blockingCustom
                ? t('app:tournaments.blockingNamed', { name: blockingCustom.name })
                : t('app:tournaments.blockingGeneric')}
            </p>
          )}
        </section>
      )}

      <section className="flex flex-col gap-4">
        {tournaments.map((t2) => {
          const league = findLeague(t2.leagueId)
          const canManage = isOwner && t2.kind === 'custom' && !t2.revealed
          const progressPct =
            t2.progress.total && t2.progress.total > 0
              ? Math.min(100, (t2.progress.current / t2.progress.total) * 100)
              : null

          return (
            <div
              key={t2.id}
              className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-gold dark:bg-neutral-900">
                    <BadgeIcon badgeKey={t2.badgeKey} size={24} />
                  </span>
                  <div>
                    <LocaleLink
                      href={`/app/${spaceSlug}/tournaments/${t2.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {t2.name}
                    </LocaleLink>
                    <p className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
                      <span>
                        {t2.kind === 'monthly' && monthLabel(t2.monthKey ?? '')}
                        {t2.kind === 'yearly' && t2.year}
                        {t2.kind === 'custom' && t('app:tournaments.startsOn', { date: t2.startDate })}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[t2.status]}`}
                      >
                        {t(`app:tournaments.status.${t2.status}`)}
                      </span>
                    </p>
                  </div>
                </div>
                {league && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={leagueLogoUrl(league.id)} alt={league.name} className="h-8 w-8 shrink-0 object-contain" />
                )}
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-sm text-neutral-500" dir="ltr">
                  {t2.progress.label}
                </p>
                {progressPct !== null && (
                  <span className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gold-dim">
                    <span className="block h-full rounded-full bg-gold" style={{ width: `${Math.max(2, progressPct)}%` }} />
                  </span>
                )}
              </div>

              {canManage && (
                <EditTournamentForm
                  spaceId={spaceId}
                  tournamentId={t2.id}
                  initialName={t2.name}
                  initialStartDate={t2.startDate ?? ''}
                  initialMatchesRequired={t2.matchesRequired ?? 5}
                />
              )}

              {isOwner && t2.status === 'finished' && !t2.revealed && (
                <RevealButton spaceId={spaceId} tournamentId={t2.id} />
              )}

              {t2.revealed && t2.results && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(t2.results.prizes).map(([key, prize]) => (
                    <div
                      key={key}
                      className="flex flex-col gap-1 rounded-md border border-neutral-100 bg-neutral-50 p-3 text-sm dark:border-neutral-900 dark:bg-neutral-900/60"
                    >
                      <p className="flex items-center gap-1.5 font-medium">
                        <span aria-hidden>{PRIZE_EMOJI[key]}</span>
                        {PRIZE_META[key as keyof typeof PRIZE_META]?.label ?? key}
                      </p>
                      <p className="text-gold">{prize.winners.map((w) => nameById.get(w) ?? w).join(' & ')}</p>
                      <p className="text-xs text-neutral-500" dir="ltr">
                        {prize.why}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}

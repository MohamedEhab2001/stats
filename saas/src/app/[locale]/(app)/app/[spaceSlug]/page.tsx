import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { getStandingsForSpace, listWeeks, toEngineWeek } from '@/lib/services/matchWeeks'
import { listMembers } from '@/lib/services/memberships'
import { getFifaCardForSpace } from '@/lib/services/fifaCard'
import { computeMOTM } from '@/lib/stats-engine/motm'
import { LocaleLink } from '@/i18n/navigation'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'

const MEDAL = ['🥇', '🥈', '🥉']

function TileIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-gold"
    >
      <path d={path} />
    </svg>
  )
}

const ICONS = {
  members: 'M17 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M13 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm7 13v-1a3.5 3.5 0 0 0-2.5-3.4M16.5 3.6A3 3 0 0 1 18 9',
  calendar: 'M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z',
  crown: 'M4 9l2 6h12l2-6-4 3-4-5-4 5-4-3Zm1 8h14',
  card: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 4h18M7 15h4'
} as const

export default async function OverviewPage({
  params
}: {
  params: Promise<{ locale: string; spaceSlug: string }>
}) {
  const { locale: rawLocale, spaceSlug } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { space, session } = await requireSpaceMembership(locale, spaceSlug)
  const spaceId = String(space._id)

  const [standings, weekDocs, members, myCards] = await Promise.all([
    getStandingsForSpace(spaceId, 'all'),
    listWeeks(spaceId),
    listMembers(spaceId),
    getFifaCardForSpace(spaceId, session.user.id)
  ])
  const nicknameById = new Map(members.map((m) => [m.userId, m.nickname]))
  const myCard = myCards[session.user.id]

  const recentWeeks = weekDocs.slice(0, 5)
  const leader = standings.rows[0]
  const topPIndex = Math.max(1, leader?.pIndex ?? 0)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{space.name}</h1>
        <LocaleLink
          href={`/app/${space.slug}/log`}
          className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-soft"
        >
          {t('app:overview.logButton')}
        </LocaleLink>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <TileIcon path={ICONS.members} />
          <span className="text-2xl font-semibold">{members.length}</span>
          <span className="text-xs text-neutral-500">{t('app:overview.tiles.members')}</span>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <TileIcon path={ICONS.calendar} />
          <span className="text-2xl font-semibold">{weekDocs.length}</span>
          <span className="text-xs text-neutral-500">{t('app:overview.tiles.weeksLogged')}</span>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <TileIcon path={ICONS.crown} />
          {leader && leader.pIndex > 0 ? (
            <>
              <span className="truncate text-2xl font-semibold">{leader.nickname}</span>
              <span className="text-xs text-neutral-500" dir="ltr">
                P-Index {leader.pIndex.toFixed(1)}
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-semibold text-neutral-400">—</span>
              <span className="text-xs text-neutral-500">{t('app:overview.tiles.leaderNone')}</span>
            </>
          )}
        </div>

        <LocaleLink
          href={`/app/${space.slug}/scouting`}
          className="flex flex-col gap-2 rounded-lg border border-gold/40 bg-gold-dim p-4 transition hover:border-gold"
        >
          <TileIcon path={ICONS.card} />
          {myCard ? (
            <span className="text-2xl font-semibold text-gold" dir="ltr">
              {myCard.ovr}
            </span>
          ) : (
            <span className="text-2xl font-semibold text-neutral-400">—</span>
          )}
          <span className="text-xs text-neutral-500">{t('app:overview.tiles.yourCardCta')}</span>
        </LocaleLink>
      </section>

      <div className="grid gap-8 md:grid-cols-3">
        <section className="md:col-span-2">
          <h2 className="mb-3 text-lg font-medium">{t('app:overview.standingsHeading')}</h2>
          {standings.rows.length === 0 ? (
            <p className="text-sm text-neutral-500">{t('app:overview.noStats')}</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {standings.rows.map((row, i) => (
                <li
                  key={row.userId}
                  className="flex items-center gap-3 rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold dark:bg-neutral-900">
                    {i < 3 ? MEDAL[i] : i + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{row.nickname}</span>
                      <span className="shrink-0 text-xs text-neutral-500" dir="ltr">
                        P-Index {row.pIndex.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gold-dim">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${Math.max(2, (Math.max(0, row.pIndex) / topPIndex) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-[10px] font-semibold" dir="ltr">
                    <span className="rounded bg-green-600/15 px-1.5 py-0.5 text-green-700 dark:text-green-400">
                      {row.wins}W
                    </span>
                    <span className="rounded bg-neutral-500/15 px-1.5 py-0.5 text-neutral-600 dark:text-neutral-400">
                      {row.draws}D
                    </span>
                    <span className="rounded bg-red-600/15 px-1.5 py-0.5 text-red-700 dark:text-red-400">
                      {row.losses}L
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium">{t('app:overview.recentWeeksHeading')}</h2>
          {recentWeeks.length === 0 ? (
            <p className="text-sm text-neutral-500">{t('app:overview.noWeeksLogged')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentWeeks.map((w) => {
                const motm = computeMOTM(toEngineWeek(w))
                return (
                  <li
                    key={String(w._id)}
                    className="flex flex-col gap-1 rounded-md border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{w.weekKey}</span>
                      <span className="text-xs text-neutral-500">
                        {t('app:overview.loggedCount', { count: w.entries.length })}
                      </span>
                    </div>
                    {motm && (
                      <p className="flex items-center gap-1 text-xs text-neutral-500">
                        <span aria-hidden>⭐</span>
                        {t('app:overview.motmLabel')}:{' '}
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {motm.winner === 'tie'
                            ? t('app:overview.motmTied')
                            : (nicknameById.get(motm.winner) ?? motm.winner)}
                        </span>
                        {motm.winner !== 'tie' && motm.reasons[0] ? ` — ${motm.reasons[0]}` : ''}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

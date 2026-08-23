import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { getScoutingForSpace } from '@/lib/services/scouting'
import { TIERS } from '@/lib/stats-engine/scouting'
import { getFifaCardForSpace } from '@/lib/services/fifaCard'
import { MIN_WEEKS_FOR_CONFIDENT_CARD } from '@/lib/stats-engine/fifaCard'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import FifaCardView from '../FifaCardView'
import ShareCardButton from '@/components/ShareCardButton'

export default async function ScoutingPage({
  params
}: {
  params: Promise<{ locale: string; spaceSlug: string }>
}) {
  const { locale: rawLocale, spaceSlug } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { space } = await requireSpaceMembership(locale, spaceSlug)
  const spaceId = String(space._id)
  const { reports } = await getScoutingForSpace(spaceId)
  const rows = Object.values(reports)
  const fifaCards = await getFifaCardForSpace(spaceId)

  const tierLabels = {
    clinical: t('app:fifaCard.tier.clinical'),
    normal: t('app:fifaCard.tier.normal'),
    wasteful: t('app:fifaCard.tier.wasteful'),
    unrated: ''
  } as const

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">{t('app:scouting.title')}</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">{t('app:scouting.noMembers')}</p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.userId} className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{r.nickname}</h3>
                {!r.unscouted && (
                  <span className="text-xs font-semibold" style={{ color: r.tier.accent }}>
                    {r.tier.name}
                  </span>
                )}
              </div>

              {r.unscouted ? (
                <p className="mt-2 text-sm text-neutral-500">
                  {t('app:scouting.matchesNeeded', { count: r.needed - r.played })}
                </p>
              ) : (
                <div className="mt-2 flex flex-col gap-2 text-sm">
                  <p className="text-neutral-500">{r.tier.sub}</p>
                  <p>{t('app:scouting.scoreLine', { score: r.score.toFixed(1), value: r.formattedValue })}</p>
                  <div className="flex gap-1">
                    {r.form.map((f, i) => (
                      <span
                        key={i}
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ${
                          f === 'W' ? 'bg-green-600' : f === 'L' ? 'bg-red-600' : 'bg-neutral-500'
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <ul className="mt-1 flex flex-col gap-0.5 text-xs text-neutral-500">
                    {r.drivers.slice(0, 3).map((d) => (
                      <li key={d.key}>
                        {d.label}: {d.value}
                      </li>
                    ))}
                  </ul>
                  {r.nextTier && (
                    <p className="text-xs text-neutral-500">
                      {t('app:scouting.nextTierLine', {
                        points: r.nextTier.scoreNeeded.toFixed(1),
                        tier: r.nextTier.name
                      })}
                    </p>
                  )}
                </div>
              )}

              {fifaCards[r.userId] && (
                <div className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {t('app:fifaCard.heading')}
                  </h4>
                  <FifaCardView
                    card={fifaCards[r.userId]}
                    nickname={fifaCards[r.userId].nickname}
                    tierLabels={tierLabels}
                    xgLabel={t('app:fifaCard.xgLabel')}
                    provisionalNote={
                      fifaCards[r.userId].provisional
                        ? t('app:fifaCard.provisionalNote', {
                            count: Math.max(0, MIN_WEEKS_FOR_CONFIDENT_CARD - r.played)
                          })
                        : undefined
                    }
                  />
                  <ShareCardButton
                    spaceId={spaceId}
                    userId={r.userId}
                    nickname={fifaCards[r.userId].nickname}
                  />
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-medium">{t('app:scouting.tierRoadmapHeading')}</h2>
        <ol className="flex flex-col gap-1 text-sm">
          {TIERS.map((tier) => (
            <li
              key={tier.name}
              className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
            >
              <span className="font-medium" style={{ color: tier.accent }}>
                {tier.name}
              </span>
              <span className="text-neutral-500">{tier.sub}</span>
              <span className="text-neutral-500">
                {tier.min}&ndash;{tier.max}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

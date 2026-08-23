import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { listMembers } from '@/lib/services/memberships'
import { getComparisonForSpace } from '@/lib/services/matchWeeks'
import { getFifaCardForSpace } from '@/lib/services/fifaCard'
import { MIN_WEEKS_FOR_CONFIDENT_CARD } from '@/lib/stats-engine/fifaCard'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import ComparePickers from './ComparePickers'
import FifaCardView from '../FifaCardView'
import ShareCardButton from '@/components/ShareCardButton'

export default async function ComparePage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; spaceSlug: string }>
  searchParams: Promise<{ a?: string; b?: string }>
}) {
  const { locale: rawLocale, spaceSlug } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { a, b } = await searchParams
  const { space } = await requireSpaceMembership(locale, spaceSlug)
  const spaceId = String(space._id)

  const members = await listMembers(spaceId)
  const comparison = a && b && a !== b ? await getComparisonForSpace(spaceId, a, b) : null
  const fifaCards = comparison ? await getFifaCardForSpace(spaceId) : null

  const tierLabels = {
    clinical: t('app:fifaCard.tier.clinical'),
    normal: t('app:fifaCard.tier.normal'),
    wasteful: t('app:fifaCard.tier.wasteful'),
    unrated: ''
  } as const

  function provisionalNoteFor(userId: string) {
    const card = fifaCards?.[userId]
    if (!card?.provisional) return undefined
    return t('app:fifaCard.provisionalNote', {
      count: Math.max(0, MIN_WEEKS_FOR_CONFIDENT_CARD - card.played)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t('app:compare.title')}</h1>
      <ComparePickers members={members} selectedA={a} selectedB={b} />

      {a && b && a === b && (
        <p className="text-sm text-neutral-500">{t('app:compare.pickTwoDifferent')}</p>
      )}

      {comparison && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
              <h2 className="font-medium">{comparison.a.nickname}</h2>
              <p className="text-sm text-neutral-500">
                {comparison.record.a.w}W {comparison.record.a.d}D {comparison.record.a.l}L
                &middot; {comparison.record.a.gf} {t('app:compare.goalsFor')} /{' '}
                {comparison.record.a.ga} {t('app:compare.goalsAgainst')}
              </p>
            </div>
            <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
              <h2 className="font-medium">{comparison.b.nickname}</h2>
              <p className="text-sm text-neutral-500">
                {comparison.record.b.w}W {comparison.record.b.d}D {comparison.record.b.l}L
                &middot; {comparison.record.b.gf} {t('app:compare.goalsFor')} /{' '}
                {comparison.record.b.ga} {t('app:compare.goalsAgainst')}
              </p>
            </div>
          </div>

          {fifaCards && fifaCards[comparison.a.userId] && fifaCards[comparison.b.userId] && (
            <div>
              <h2 className="mb-3 text-lg font-medium">{t('app:fifaCard.heading')}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <FifaCardView
                    card={fifaCards[comparison.a.userId]}
                    nickname={comparison.a.nickname}
                    tierLabels={tierLabels}
                    xgLabel={t('app:fifaCard.xgLabel')}
                    provisionalNote={provisionalNoteFor(comparison.a.userId)}
                  />
                  <ShareCardButton spaceId={spaceId} userId={comparison.a.userId} nickname={comparison.a.nickname} />
                </div>
                <div className="flex flex-col gap-3">
                  <FifaCardView
                    card={fifaCards[comparison.b.userId]}
                    nickname={comparison.b.nickname}
                    tierLabels={tierLabels}
                    xgLabel={t('app:fifaCard.xgLabel')}
                    provisionalNote={provisionalNoteFor(comparison.b.userId)}
                  />
                  <ShareCardButton spaceId={spaceId} userId={comparison.b.userId} nickname={comparison.b.nickname} />
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-lg font-medium">
              {t('app:compare.perStatLeaderHeading', { count: comparison.sharedWeeksCount })}
            </h2>
            {comparison.sharedWeeksCount === 0 ? (
              <p className="text-sm text-neutral-500">{t('app:compare.noSharedWeeks')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-start text-neutral-500 dark:border-neutral-800">
                      <th className="py-2 pe-4">{t('app:compare.columns.stat')}</th>
                      <th className="py-2 pe-4">{comparison.a.nickname}</th>
                      <th className="py-2 pe-4">{t('app:compare.columns.ties')}</th>
                      <th className="py-2 pe-4">{comparison.b.nickname}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.statDefs.map((s) => {
                      const row = comparison.perStat[s.key]
                      return (
                        <tr
                          key={s.key}
                          className="border-b border-neutral-100 dark:border-neutral-900"
                        >
                          <td className="py-2 pe-4">{s.label}</td>
                          <td className="py-2 pe-4">{row.a}</td>
                          <td className="py-2 pe-4">{row.ties}</td>
                          <td className="py-2 pe-4">{row.b}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

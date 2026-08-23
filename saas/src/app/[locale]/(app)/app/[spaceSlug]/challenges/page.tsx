import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { getActiveChallenge, getChallengeHistory } from '@/lib/services/challenges'
import { DIFF_EMOJI } from '@/lib/domain/challenge-catalog'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import ChallengePicker from './ChallengePicker'

export default async function ChallengesPage({
  params
}: {
  params: Promise<{ locale: string; spaceSlug: string }>
}) {
  const { locale: rawLocale, spaceSlug } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { space, membership } = await requireSpaceMembership(locale, spaceSlug)
  const spaceId = String(space._id)

  const [active, history] = await Promise.all([getActiveChallenge(spaceId), getChallengeHistory(spaceId)])

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">{t('app:challenges.title')}</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t('app:challenges.thisWeekHeading')}</h2>
        {active ? (
          <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="font-medium">
              {DIFF_EMOJI[active.challenge.difficulty]} {active.challenge.title}
              <span className="ms-2 text-xs font-normal text-neutral-500">
                {t(`app:challenges.difficulty.${active.challenge.difficulty}`)} &middot;{' '}
                {t('app:challenges.pointsSuffix', { points: active.challenge.points })}
              </span>
            </p>
            <p className="mt-1 text-sm text-neutral-500">{active.challenge.description}</p>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">{t('app:challenges.noActive')}</p>
        )}

        {membership.role === 'owner' && (
          <ChallengePicker spaceId={spaceId} currentChallengeId={active?.challengeId} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">{t('app:challenges.historyHeading')}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-neutral-500">{t('app:challenges.noHistory')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((h) => {
              const completed = h.completions.filter((c) => c.completed)
              return (
                <li
                  key={`${h.weekId}-${h.challengeId}`}
                  className="rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-800"
                >
                  <p className="font-medium">
                    {h.weekKey} &middot; {h.challenge?.title ?? h.challengeId}
                  </p>
                  <p className="mt-1 text-neutral-500">
                    {completed.length === 0
                      ? t('app:challenges.nobodyCompleted')
                      : completed.map((c) => `${c.nickname} (+${h.challenge?.points ?? 0})`).join(', ')}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

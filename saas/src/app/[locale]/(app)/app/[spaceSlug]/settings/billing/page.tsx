import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { countActiveMembers } from '@/lib/services/memberships'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import UpgradeButton from './UpgradeButton'

export default async function BillingPage({
  params
}: {
  params: Promise<{ locale: string; spaceSlug: string }>
}) {
  const { locale: rawLocale, spaceSlug } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { space, membership } = await requireSpaceMembership(locale, spaceSlug)
  const activeCount = await countActiveMembers(String(space._id))

  return (
    <div className="flex max-w-md flex-col gap-8">
      <h1 className="text-2xl font-semibold">{t('app:settings.billing.title')}</h1>

      <section className="flex flex-col gap-2 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="text-sm text-neutral-500">{t('app:settings.billing.currentPlan')}</p>
        <p className="text-lg font-medium">{t(`app:plan.${space.plan!.tier}`)}</p>
        <p className="text-sm text-neutral-500">
          {t('app:settings.billing.seatsUsed', { active: activeCount, cap: space.plan!.memberCap })}
        </p>
      </section>

      {membership.role === 'owner' ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">{t('app:settings.billing.needMoreSeatsHeading')}</h2>
          <p className="text-sm text-neutral-500">{t('app:settings.billing.proDescription')}</p>
          <UpgradeButton spaceId={String(space._id)} />
        </section>
      ) : (
        <p className="text-sm text-neutral-500">{t('app:settings.billing.ownerOnly')}</p>
      )}
    </div>
  )
}

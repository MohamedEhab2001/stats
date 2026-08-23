import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import StatDefinitionsManager from './StatDefinitionsManager'

export default async function StatAttributesPage({
  params
}: {
  params: Promise<{ locale: string; spaceSlug: string }>
}) {
  const { locale: rawLocale, spaceSlug } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { space, membership } = await requireSpaceMembership(locale, spaceSlug)

  const statDefinitions = [...space.statDefinitions]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      key: s.key,
      label: s.label,
      short: s.short,
      max: s.max,
      weight: s.weight,
      higherIsBetter: s.higherIsBetter,
      blurb: s.blurb ?? '',
      enabled: s.enabled,
      isCustom: s.isCustom
    }))

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">{t('app:settings.statAttributes.title')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('app:settings.statAttributes.description')}</p>
      </div>
      <StatDefinitionsManager
        spaceId={String(space._id)}
        isOwner={membership.role === 'owner'}
        initialDefs={statDefinitions}
      />
    </div>
  )
}

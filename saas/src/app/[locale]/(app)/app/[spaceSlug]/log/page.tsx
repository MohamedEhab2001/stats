import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import LogForm from './LogForm'

export default async function LogWeekPage({
  params
}: {
  params: Promise<{ locale: string; spaceSlug: string }>
}) {
  const { locale: rawLocale, spaceSlug } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { space } = await requireSpaceMembership(locale, spaceSlug)

  const statDefs = space.statDefinitions
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ key: s.key, label: s.label, short: s.short, max: s.max, blurb: s.blurb ?? '' }))

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t('app:log.title')}</h1>
      <LogForm
        spaceId={String(space._id)}
        spaceSlug={space.slug}
        statDefs={statDefs}
        defaultDate={today}
      />
    </div>
  )
}

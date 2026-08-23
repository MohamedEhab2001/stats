'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from '@/i18n/navigation'
import { localeHref } from '@/i18n/href'
import { useTranslation } from '@/i18n/client'

type SpaceOption = { slug: string; name: string }

export default function SpaceSwitcher({
  current,
  spaces
}: {
  current: SpaceOption
  spaces: SpaceOption[]
}) {
  const router = useRouter()
  const locale = useLocale()
  const { t } = useTranslation('app')

  return (
    <select
      value={current.slug}
      onChange={(e) => router.push(localeHref(locale, `/app/${e.target.value}`))}
      aria-label={t('space.switcherLabel')}
      className="rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm font-medium dark:border-neutral-700"
    >
      {spaces.map((s) => (
        <option key={s.slug} value={s.slug}>
          {s.name}
        </option>
      ))}
    </select>
  )
}

'use client'

import { usePathname } from 'next/navigation'
import { LocaleLink } from '@/i18n/navigation'
import { localeHref } from '@/i18n/href'
import { useLocale } from '@/i18n/navigation'

export default function TabNav({
  spaceSlug,
  tabs
}: {
  spaceSlug: string
  tabs: { href: string; label: string }[]
}) {
  const pathname = usePathname()
  const locale = useLocale()
  const base = localeHref(locale, `/app/${spaceSlug}`)

  return (
    <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6 pb-2 text-sm">
      {tabs.map((tab) => {
        const href = `${base}${tab.href}`
        const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href)
        return (
          <LocaleLink
            key={tab.label}
            href={`/app/${spaceSlug}${tab.href}`}
            className={
              isActive
                ? 'whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-gold'
                : 'whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-gold-dim hover:text-gold'
            }
          >
            {tab.label}
          </LocaleLink>
        )
      })}
    </nav>
  )
}

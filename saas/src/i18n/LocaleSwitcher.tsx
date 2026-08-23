'use client'

import { usePathname, useRouter } from 'next/navigation'
import { locales, type Locale } from './settings'
import { useLocale } from './navigation'
import { useTranslation } from './client'

// Small AR/EN toggle that preserves the current path, just swapping the leading /[locale]
// segment — used in both the marketing header/footer and the authenticated app shell header.
export default function LocaleSwitcher({ className }: { className?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const current = useLocale()
  const { t } = useTranslation('common')

  function switchTo(locale: Locale) {
    if (locale === current) return
    const segments = pathname.split('/')
    segments[1] = locale
    router.push(segments.join('/') || `/${locale}`)
  }

  return (
    <div
      role="group"
      aria-label={t('locale.switchLabel')}
      className={`flex items-center gap-1 text-xs font-semibold ${className ?? ''}`}
    >
      {locales.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1">
          {i > 0 && <span className="opacity-30">/</span>}
          <button
            type="button"
            onClick={() => switchTo(locale)}
            aria-current={locale === current}
            className={
              locale === current
                ? 'text-gold'
                : 'opacity-60 transition hover:opacity-100'
            }
          >
            {t(`locale.${locale}`)}
          </button>
        </span>
      ))}
    </div>
  )
}

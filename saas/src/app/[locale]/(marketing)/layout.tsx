import { LocaleLink } from '@/i18n/navigation'
import LocaleSwitcher from '@/i18n/LocaleSwitcher'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'

// statsDor's marketing site commits fully to a black/white/gold identity — a fixed dark theme,
// independent of the app shell's light/dark-mode-respecting surfaces (see (app)/app/[spaceSlug]/layout.tsx).
export default async function MarketingLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)

  const brandName = t('common:brand.name')
  const brandLead = brandName.slice(0, -2)
  const brandTail = brandName.slice(-2)

  return (
    <div className="flex min-h-screen flex-col bg-ink text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-ink/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <LocaleLink href="/" className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
            {brandLead}
            <span className="text-gold">{brandTail}</span>
          </LocaleLink>
          <div className="flex items-center gap-6 text-sm">
            <LocaleLink href="/pricing" className="text-white/70 transition hover:text-white">
              {t('common:nav.pricing')}
            </LocaleLink>
            <LocaleLink href="/login" className="text-white/70 transition hover:text-white">
              {t('common:nav.login')}
            </LocaleLink>
            <LocaleLink
              href="/register"
              className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-soft"
            >
              {t('common:nav.signup')}
            </LocaleLink>
            <LocaleSwitcher />
          </div>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-[family-name:var(--font-display)] font-bold text-white">
              {brandLead}
              <span className="text-gold">{brandTail}</span>
            </span>{' '}
            &middot; {t('common:brand.tagline')}
          </p>
          <div className="flex gap-6">
            <LocaleLink href="/pricing" className="transition hover:text-white">
              {t('common:nav.pricing')}
            </LocaleLink>
            <LocaleLink href="/login" className="transition hover:text-white">
              {t('common:nav.login')}
            </LocaleLink>
            <LocaleLink href="/register" className="transition hover:text-white">
              {t('common:nav.signup')}
            </LocaleLink>
          </div>
        </div>
      </footer>
    </div>
  )
}

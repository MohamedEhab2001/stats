import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { LocaleLink } from '@/i18n/navigation'
import { localeHref } from '@/i18n/href'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'

type Feature = { n: string; title: string; body: string }

export default async function MarketingHomePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'

  const session = await auth()
  if (session?.user) redirect(localeHref(locale, '/app'))

  const { t } = await getT(locale)
  const features = t('marketing:features.items', { returnObjects: true }) as Feature[]

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-28 sm:py-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 0%, var(--color-gold-dim), transparent 70%)'
          }}
        />
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            {t('marketing:hero.eyebrow')}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight sm:text-6xl">
            {t('marketing:hero.titleLine1')}
            <br />
            {t('marketing:hero.titleLine2')}
          </h1>
          <p className="max-w-xl text-base text-white/60 sm:text-lg">
            {t('marketing:hero.subtitle')}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <LocaleLink
              href="/register"
              className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft"
            >
              {t('marketing:hero.ctaPrimary')}
            </LocaleLink>
            <LocaleLink
              href="/pricing"
              className="rounded-md border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:border-gold hover:text-gold"
            >
              {t('marketing:hero.ctaSecondary')}
            </LocaleLink>
          </div>
          <p className="text-xs text-white/40">{t('marketing:hero.note')}</p>
        </div>
      </section>

      {/* Feature sections */}
      <section className="border-t border-white/10 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 flex flex-col gap-3 text-center">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
              {t('marketing:features.heading')}
            </h2>
            <p className="mx-auto max-w-xl text-white/60">{t('marketing:features.subtitle')}</p>
          </div>

          <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.n} className="flex flex-col gap-2">
                <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-gold">
                  {f.n}
                </span>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/10 px-6 py-24 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
            {t('marketing:finalCta.title')}
          </h2>
          <p className="text-white/60">{t('marketing:finalCta.body')}</p>
          <div className="h-px w-16 bg-gold" />
          <LocaleLink
            href="/register"
            className="rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold-soft"
          >
            {t('marketing:finalCta.cta')}
          </LocaleLink>
        </div>
      </section>
    </div>
  )
}

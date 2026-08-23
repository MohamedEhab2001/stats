import { LocaleLink } from '@/i18n/navigation'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'

export default async function PricingPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)

  const freeFeatures = t('marketing:pricing.free.features', { returnObjects: true }) as string[]
  const proFeatures = t('marketing:pricing.pro.features', { returnObjects: true }) as string[]

  return (
    <div className="flex flex-1 flex-col px-6 py-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          {t('marketing:pricing.eyebrow')}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold sm:text-5xl">
          {t('marketing:pricing.title')}
        </h1>
        <p className="max-w-lg text-white/60">{t('marketing:pricing.subtitle')}</p>
      </div>

      <div className="mx-auto mt-16 grid w-full max-w-4xl gap-8 sm:grid-cols-2">
        {/* Free */}
        <div className="flex flex-col gap-6 rounded-xl border border-white/10 p-8">
          <div>
            <h2 className="text-lg font-semibold text-white/80">
              {t('marketing:pricing.free.title')}
            </h2>
            <p className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">
              {t('marketing:pricing.free.price')}
              <span className="text-base font-normal text-white/50">
                {' '}
                {t('marketing:pricing.free.priceNote')}
              </span>
            </p>
          </div>
          <ul className="flex flex-1 flex-col gap-3 text-sm text-white/70">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 text-gold">&#10003;</span>
                {f}
              </li>
            ))}
          </ul>
          <LocaleLink
            href="/register"
            className="rounded-md border border-white/20 px-5 py-2.5 text-center text-sm font-medium text-white transition hover:border-gold hover:text-gold"
          >
            {t('marketing:pricing.free.cta')}
          </LocaleLink>
        </div>

        {/* Pro */}
        <div className="relative flex flex-col gap-6 rounded-xl border border-gold p-8">
          <span className="absolute -top-3 end-6 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-ink">
            {t('marketing:pricing.pro.badge')}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-gold">{t('marketing:pricing.pro.title')}</h2>
            <p className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">
              {t('marketing:pricing.pro.priceLabel')}
              <span className="block text-base font-normal text-white/50">
                {t('marketing:pricing.pro.priceNote')}
              </span>
            </p>
          </div>
          <ul className="flex flex-1 flex-col gap-3 text-sm text-white/70">
            {proFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 text-gold">&#10003;</span>
                {f}
              </li>
            ))}
          </ul>
          <LocaleLink
            href="/register"
            className="rounded-md bg-gold px-5 py-2.5 text-center text-sm font-semibold text-ink transition hover:bg-gold-soft"
          >
            {t('marketing:pricing.pro.cta')}
          </LocaleLink>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-lg text-center text-xs text-white/40">
        {t('marketing:pricing.footnotePre')}
        <LocaleLink href="/login" className="underline hover:text-gold">
          {t('marketing:pricing.footnoteLoginText')}
        </LocaleLink>
        {t('marketing:pricing.footnotePost')}
      </p>
    </div>
  )
}

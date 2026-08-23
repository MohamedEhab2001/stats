import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { listMySpaces } from '@/lib/services/spaces'
import { LocaleLink } from '@/i18n/navigation'
import { localeHref } from '@/i18n/href'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import SignOutButton from '@/components/SignOutButton'

export default async function AppHomePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'

  const session = await auth()
  if (!session?.user?.id) redirect(localeHref(locale, '/login'))

  const { t } = await getT(locale)
  const rows = await listMySpaces(session.user.id)

  if (rows.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">{t('app:space.onboarding.title')}</h1>
        <p className="text-neutral-500 dark:text-neutral-400">{t('app:space.onboarding.body')}</p>
        <LocaleLink
          href="/app/new"
          className="rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-gold-soft"
        >
          {t('app:space.onboarding.cta')}
        </LocaleLink>
        <SignOutButton />
      </div>
    )
  }

  if (rows.length === 1) {
    redirect(localeHref(locale, `/app/${rows[0].space.slug}`))
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('app:space.list.title')}</h1>
        <SignOutButton />
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map(({ space, membership }) => (
          <li key={String(space._id)}>
            <LocaleLink
              href={`/app/${space.slug}`}
              className="block rounded-md border border-neutral-200 px-4 py-3 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
              <span className="font-medium">{space.name}</span>
              <span className="ms-2 text-sm text-neutral-500">
                ({t(`app:space.role.${membership.role}`)})
              </span>
            </LocaleLink>
          </li>
        ))}
      </ul>
      <LocaleLink href="/app/new" className="text-sm underline">
        {t('app:space.list.createAnother')}
      </LocaleLink>
    </div>
  )
}

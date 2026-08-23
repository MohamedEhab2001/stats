import LoginTabs from './LoginTabs'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'

export default async function LoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ callbackUrl?: string; mode?: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { callbackUrl, mode } = await searchParams
  const { t } = await getT(locale)

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        {t('auth:login.title')}
      </h1>
      <LoginTabs callbackUrl={callbackUrl} initialMode={mode === 'member' ? 'member' : 'manager'} />
    </div>
  )
}

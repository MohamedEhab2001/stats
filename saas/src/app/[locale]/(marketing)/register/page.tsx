import RegisterForm from './RegisterForm'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'

export default async function RegisterPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ inviteCode?: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { inviteCode } = await searchParams
  const { t } = await getT(locale)

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        {t('auth:register.title')}
      </h1>
      <RegisterForm inviteCode={inviteCode} />
    </div>
  )
}

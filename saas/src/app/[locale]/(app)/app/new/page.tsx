import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import NewSpaceForm from './NewSpaceForm'

export default async function NewSpacePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">{t('app:space.new.title')}</h1>
      <NewSpaceForm />
    </div>
  )
}

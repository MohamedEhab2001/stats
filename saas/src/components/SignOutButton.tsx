'use client'

import { signOut } from 'next-auth/react'
import { useLocale } from '@/i18n/navigation'
import { localeHref } from '@/i18n/href'
import { useTranslation } from '@/i18n/client'

export default function SignOutButton() {
  const locale = useLocale()
  const { t } = useTranslation('common')

  return (
    <button
      onClick={() => signOut({ callbackUrl: localeHref(locale, '/') })}
      className="text-sm text-neutral-500 underline-offset-2 hover:underline"
    >
      {t('nav.logout')}
    </button>
  )
}

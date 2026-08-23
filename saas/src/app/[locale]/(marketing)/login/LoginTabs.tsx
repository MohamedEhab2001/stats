'use client'

import { useState } from 'react'
import { useTranslation } from '@/i18n/client'
import LoginForm from './LoginForm'
import MemberLoginForm from './MemberLoginForm'

type Mode = 'manager' | 'member'

export default function LoginTabs({
  callbackUrl,
  initialMode
}: {
  callbackUrl?: string
  initialMode: Mode
}) {
  const { t } = useTranslation('auth')
  const [mode, setMode] = useState<Mode>(initialMode)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex rounded-md border border-white/15 bg-white/5 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode('manager')}
          aria-pressed={mode === 'manager'}
          className={
            mode === 'manager'
              ? 'flex-1 rounded-md bg-gold px-3 py-2 font-semibold text-ink transition'
              : 'flex-1 rounded-md px-3 py-2 text-white/70 transition hover:text-white'
          }
        >
          {t('login.tabs.manager')}
        </button>
        <button
          type="button"
          onClick={() => setMode('member')}
          aria-pressed={mode === 'member'}
          className={
            mode === 'member'
              ? 'flex-1 rounded-md bg-gold px-3 py-2 font-semibold text-ink transition'
              : 'flex-1 rounded-md px-3 py-2 text-white/70 transition hover:text-white'
          }
        >
          {t('login.tabs.member')}
        </button>
      </div>
      {mode === 'manager' ? (
        <LoginForm callbackUrl={callbackUrl} />
      ) : (
        <MemberLoginForm callbackUrl={callbackUrl} />
      )}
    </div>
  )
}

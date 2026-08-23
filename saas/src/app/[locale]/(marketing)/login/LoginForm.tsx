'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { LocaleLink, useLocale } from '@/i18n/navigation'
import { localeHref } from '@/i18n/href'
import { useTranslation } from '@/i18n/client'
import PasswordInput from '@/components/PasswordInput'

export default function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter()
  const locale = useLocale()
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (!res || res.error) {
        setError(t('login.error'))
        return
      }
      router.push(callbackUrl || localeHref(locale, '/app'))
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm text-white/80">
        {t('login.emailLabel')}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-gold"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-white/80">
        {t('login.passwordLabel')}
        <PasswordInput
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-gold"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-md bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-soft disabled:opacity-50"
      >
        {loading ? t('login.submitting') : t('login.submit')}
      </button>
      <p className="text-sm text-white/50">
        {t('login.noAccount')}{' '}
        <LocaleLink href="/register" className="text-gold underline">
          {t('login.signUp')}
        </LocaleLink>
      </p>
    </form>
  )
}

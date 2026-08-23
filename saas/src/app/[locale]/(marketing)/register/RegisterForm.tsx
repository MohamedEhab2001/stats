'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { LocaleLink, useLocale } from '@/i18n/navigation'
import { localeHref } from '@/i18n/href'
import { useTranslation } from '@/i18n/client'
import PasswordInput from '@/components/PasswordInput'

export default function RegisterForm({ inviteCode }: { inviteCode?: string }) {
  const router = useRouter()
  const locale = useLocale()
  const { t } = useTranslation('auth')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || t('register.errorGeneric'))
        return
      }

      const signInRes = await signIn('credentials', { email, password, redirect: false })
      if (!signInRes || signInRes.error) {
        setError(t('register.errorAutoLoginFailed'))
        router.push(localeHref(locale, '/login'))
        return
      }

      // Carried through from /join/[code] -> register?inviteCode=... so the invite can be
      // redeemed right after the account is created, without a separate manual "Join" click.
      if (inviteCode) {
        const redeemRes = await fetch(`/api/invites/${inviteCode}/redeem`, { method: 'POST' })
        const redeemData = await redeemRes.json().catch(() => ({}))
        if (redeemRes.ok && redeemData.spaceSlug) {
          router.push(localeHref(locale, `/app/${redeemData.spaceSlug}`))
          router.refresh()
          return
        }
        router.push(localeHref(locale, `/join/${inviteCode}`))
        router.refresh()
        return
      }

      router.push(localeHref(locale, '/app'))
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
        {t('register.nameLabel')}
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-gold"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-white/80">
        {t('register.emailLabel')}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-gold"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-white/80">
        {t('register.passwordLabel')}
        <PasswordInput
          required
          minLength={8}
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
        {loading ? t('register.submitting') : t('register.submit')}
      </button>
      <p className="text-sm text-white/50">
        {t('register.haveAccount')}{' '}
        <LocaleLink href="/login" className="text-gold underline">
          {t('register.logIn')}
        </LocaleLink>
      </p>
    </form>
  )
}

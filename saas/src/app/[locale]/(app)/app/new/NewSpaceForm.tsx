'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/i18n/navigation'
import { localeHref } from '@/i18n/href'
import { useTranslation } from '@/i18n/client'

type SecondMemberResult = { email: string; nickname: string; accessCode: string; billable: boolean }

export default function NewSpaceForm() {
  const router = useRouter()
  const locale = useLocale()
  const { t } = useTranslation('app')
  const [name, setName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberNickname, setMemberNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [created, setCreated] = useState<{ slug: string; secondMember: SecondMemberResult } | null>(
    null
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedEmail = memberEmail.trim()
    const trimmedNickname = memberNickname.trim()
    if (trimmedEmail && !trimmedNickname) {
      setError(t('space.new.secondMember.nicknameRequired'))
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          ...(trimmedEmail
            ? { secondMemberEmail: trimmedEmail, secondMemberNickname: trimmedNickname }
            : {})
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || t('space.new.errorGeneric'))
        return
      }

      if (data.secondMember) {
        setCreated({ slug: data.slug, secondMember: data.secondMember })
        return
      }

      router.push(localeHref(locale, `/app/${data.slug}`))
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.secondMember.accessCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — code is still shown below.
    }
  }

  function handleContinue() {
    if (!created) return
    router.push(localeHref(locale, `/app/${created.slug}`))
    router.refresh()
  }

  if (created) {
    const { secondMember } = created
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-500">{t('space.new.secondMember.successPrefix')}</p>
        <div className="flex flex-col gap-3 rounded-md border border-gold/40 bg-gold/10 px-4 py-4">
          <p className="text-sm">
            {t('space.new.secondMember.loginHint', { email: secondMember.email })}
          </p>
          <code
            dir="ltr"
            className="w-fit rounded bg-black/10 px-3 py-2 font-mono text-xl tracking-widest dark:bg-white/10"
          >
            {secondMember.accessCode}
          </code>
          <button onClick={handleCopy} className="w-fit text-sm text-gold underline">
            {copied ? t('space.new.secondMember.copied') : t('space.new.secondMember.copyCode')}
          </button>
          {secondMember.billable && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t('space.new.secondMember.billableNotice')}
            </p>
          )}
        </div>
        <button
          onClick={handleContinue}
          className="mt-2 rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-soft"
        >
          {t('space.new.secondMember.continue')}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm">
        {t('space.new.nameLabel')}
        <input
          type="text"
          required
          placeholder={t('space.new.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <div>
          <h2 className="text-sm font-medium">{t('space.new.secondMember.heading')}</h2>
          <p className="text-xs text-neutral-500">{t('space.new.secondMember.optionalHint')}</p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          {t('space.new.secondMember.emailLabel')}
          <input
            type="email"
            placeholder={t('space.new.secondMember.emailPlaceholder')}
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('space.new.secondMember.nicknameLabel')}
          <input
            type="text"
            placeholder={t('space.new.secondMember.nicknamePlaceholder')}
            value={memberNickname}
            onChange={(e) => setMemberNickname(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-soft disabled:opacity-50"
      >
        {loading ? t('space.new.submitting') : t('space.new.submit')}
      </button>
    </form>
  )
}

'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/client'

type AddedMember = { email: string; accessCode: string }

export default function CreateInviteForm({ spaceId }: { spaceId: string }) {
  const router = useRouter()
  const { t } = useTranslation('app')
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState<AddedMember | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setAdded(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nickname })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || t('settings.invites.create.errorGeneric'))
        return
      }
      setAdded({ email: data.email, accessCode: data.accessCode })
      setEmail('')
      setNickname('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {added && (
        <div className="flex flex-col gap-2 rounded-md border border-gold/40 bg-gold/10 px-3 py-3 text-sm">
          <p>
            {t('settings.invites.create.successPrefix')} <span className="font-medium">{added.email}</span>
          </p>
          <code
            dir="ltr"
            className="w-fit rounded bg-black/10 px-2 py-1 font-mono text-base tracking-wider dark:bg-white/10"
          >
            {added.accessCode}
          </code>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          placeholder={t('settings.invites.create.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          type="text"
          required
          placeholder={t('settings.invites.create.nicknamePlaceholder')}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-soft disabled:opacity-50"
        >
          {loading ? t('settings.invites.create.submitting') : t('settings.invites.create.submit')}
        </button>
      </form>
    </div>
  )
}

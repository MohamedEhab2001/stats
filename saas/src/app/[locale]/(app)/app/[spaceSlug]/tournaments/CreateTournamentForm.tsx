'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/client'

export default function CreateTournamentForm({ spaceId }: { spaceId: string }) {
  const router = useRouter()
  const { t } = useTranslation('app')
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [matchesRequired, setMatchesRequired] = useState('5')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          startDate,
          matchesRequired: Number(matchesRequired)
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || t('tournaments.form.errorGeneric'))
        return
      }
      setName('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        {t('tournaments.form.nameLabel')}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('tournaments.form.namePlaceholder')}
          className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('tournaments.form.startDateLabel')}
        <input
          type="date"
          required
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('tournaments.form.matchesRequiredLabel')}
        <input
          type="number"
          min={1}
          required
          value={matchesRequired}
          onChange={(e) => setMatchesRequired(e.target.value)}
          className="w-28 rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-soft disabled:opacity-50"
      >
        {loading ? t('tournaments.form.submitting') : t('tournaments.form.submit')}
      </button>
      {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
    </form>
  )
}

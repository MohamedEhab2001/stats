'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/client'
import DeleteTournamentButton from './DeleteTournamentButton'

// Owner-only inline editor for a custom, unrevealed tournament — collapsed to a single "Edit"
// button by default so the card stays compact for the common (read-only) case.
export default function EditTournamentForm({
  spaceId,
  tournamentId,
  initialName,
  initialStartDate,
  initialMatchesRequired
}: {
  spaceId: string
  tournamentId: string
  initialName: string
  initialStartDate: string
  initialMatchesRequired: number
}) {
  const router = useRouter()
  const { t } = useTranslation('app')
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [matchesRequired, setMatchesRequired] = useState(String(initialMatchesRequired))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), startDate, matchesRequired: Number(matchesRequired) })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || t('tournaments.edit.errorGeneric'))
        return
      }
      setEditing(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-neutral-500 underline-offset-2 hover:text-gold hover:underline"
        >
          {t('tournaments.edit.button')}
        </button>
        <DeleteTournamentButton spaceId={spaceId} tournamentId={tournamentId} />
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
    >
      <label className="flex flex-col gap-1 text-xs">
        {t('tournaments.form.nameLabel')}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        {t('tournaments.form.startDateLabel')}
        <input
          type="date"
          required
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        {t('tournaments.form.matchesRequiredLabel')}
        <input
          type="number"
          min={1}
          required
          value={matchesRequired}
          onChange={(e) => setMatchesRequired(e.target.value)}
          className="w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-gold-soft disabled:opacity-50"
      >
        {loading ? t('tournaments.edit.submitting') : t('tournaments.edit.submit')}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        {t('tournaments.edit.cancel')}
      </button>
      {error && <span className="w-full text-xs text-red-600 dark:text-red-400">{error}</span>}
    </form>
  )
}

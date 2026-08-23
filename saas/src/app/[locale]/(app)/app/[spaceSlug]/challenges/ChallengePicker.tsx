'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CHALLENGES, STAT_LABELS } from '@/lib/domain/challenge-catalog'
import { useTranslation } from '@/i18n/client'

export default function ChallengePicker({
  spaceId,
  currentChallengeId
}: {
  spaceId: string
  currentChallengeId?: string
}) {
  const router = useRouter()
  const { t } = useTranslation('app')
  const [challengeId, setChallengeId] = useState(currentChallengeId ?? '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<string, typeof CHALLENGES>()
    for (const c of CHALLENGES) {
      if (!map.has(c.stat)) map.set(c.stat, [])
      map.get(c.stat)!.push(c)
    }
    return [...map.entries()]
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!challengeId) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/challenges/active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || t('challenges.picker.errorGeneric'))
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <select
        value={challengeId}
        onChange={(e) => setChallengeId(e.target.value)}
        className="max-w-xs rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        <option value="">{t('challenges.picker.placeholder')}</option>
        {grouped.map(([stat, challenges]) => (
          <optgroup key={stat} label={STAT_LABELS[stat] ?? stat}>
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({t(`challenges.difficulty.${c.difficulty}`)}, +{c.points})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading || !challengeId}
        className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-soft disabled:opacity-50"
      >
        {loading ? t('challenges.picker.submitting') : t('challenges.picker.submit')}
      </button>
      {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
    </form>
  )
}

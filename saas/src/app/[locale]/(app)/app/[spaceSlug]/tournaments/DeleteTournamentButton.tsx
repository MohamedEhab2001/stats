'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/client'

// Two-tap delete instead of a native confirm() popup: first click arms it (turns red, label
// changes to "Delete for good?"), second click within 3s actually deletes. Auto-disarms itself so
// a stray click days later can't land on an already-armed button.
export default function DeleteTournamentButton({
  spaceId,
  tournamentId
}: {
  spaceId: string
  tournamentId: string
}) {
  const router = useRouter()
  const { t } = useTranslation('app')
  const [armed, setArmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(timer)
  }, [armed])

  async function handleClick() {
    if (!armed) {
      setArmed(true)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/tournaments/${tournamentId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || t('tournaments.delete.errorGeneric'))
        setArmed(false)
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`text-xs underline-offset-2 hover:underline disabled:opacity-50 ${
          armed ? 'font-medium text-red-600 dark:text-red-400' : 'text-neutral-500 hover:text-red-600 dark:hover:text-red-400'
        }`}
      >
        {loading ? t('tournaments.delete.deleting') : armed ? t('tournaments.delete.confirm') : t('tournaments.delete.button')}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </span>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/client'

export default function RevealButton({ spaceId, tournamentId }: { spaceId: string; tournamentId: string }) {
  const router = useRouter()
  const { t } = useTranslation('app')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/tournaments/${tournamentId}/reveal`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || t('tournaments.reveal.errorGeneric'))
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-fit rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-soft disabled:opacity-50"
      >
        {loading ? t('tournaments.reveal.revealing') : t('tournaments.reveal.button')}
      </button>
      {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
    </div>
  )
}

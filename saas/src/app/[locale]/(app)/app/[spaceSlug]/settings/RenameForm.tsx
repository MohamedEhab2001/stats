'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/client'

export default function RenameForm({
  spaceId,
  currentName
}: {
  spaceId: string
  currentName: string
}) {
  const router = useRouter()
  const { t } = useTranslation('app')
  const [name, setName] = useState(currentName)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || t('settings.rename.errorGeneric'))
        return
      }
      setSaved(true)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-soft disabled:opacity-50"
      >
        {loading ? t('settings.rename.submitting') : t('settings.rename.submit')}
      </button>
      {saved && <span className="self-center text-sm text-neutral-500">{t('settings.rename.saved')}</span>}
      {error && <span className="self-center text-sm text-red-600 dark:text-red-400">{error}</span>}
    </form>
  )
}

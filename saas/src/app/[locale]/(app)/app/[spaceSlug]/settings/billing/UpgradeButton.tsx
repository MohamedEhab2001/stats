'use client'

import { useState } from 'react'
import { useTranslation } from '@/i18n/client'

export default function UpgradeButton({ spaceId }: { spaceId: string }) {
  const { t } = useTranslation('app')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setMessage(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/billing/checkout`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      setMessage(
        data.error || (res.ok ? t('settings.billing.redirecting') : t('settings.billing.errorGeneric'))
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-soft disabled:opacity-50"
      >
        {loading ? t('settings.billing.upgrading') : t('settings.billing.upgrade')}
      </button>
      {message && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          {message}
        </p>
      )}
    </div>
  )
}

'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/client'

const OPTIONS = ['all', 'year', 'month'] as const

// A segmented pill toggle rather than a native <select> — matches the gold-accent active state
// used elsewhere in the app shell (tabs, tier badges) instead of the browser's default chrome.
export default function WindowPicker({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation('app')

  return (
    <div className="flex w-fit gap-1 rounded-full border border-neutral-200 p-1 dark:border-neutral-800">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => router.push(`${pathname}?window=${option}`)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            current === option
              ? 'bg-gold text-ink'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
          }`}
        >
          {t(`standings.window.${option}`)}
        </button>
      ))}
    </div>
  )
}

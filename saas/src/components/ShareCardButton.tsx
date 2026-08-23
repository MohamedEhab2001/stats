'use client'

import { useState } from 'react'
import { useTranslation } from '@/i18n/client'

// Renders the current member's (or any teammate's) FIFA card as a PNG via the image route and
// hands it off to the OS share sheet (Web Share API, when the browser + a real file is
// supported) or falls back to a plain download. Used on both the Scouting and Compare pages —
// every card is shareable, not just your own, since nothing on it is self-reported.
export default function ShareCardButton({
  spaceId,
  userId,
  nickname
}: {
  spaceId: string
  userId: string
  nickname: string
}) {
  const { t } = useTranslation('app')
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle')

  async function handleShare() {
    setStatus('working')
    try {
      const res = await fetch(`/api/spaces/${spaceId}/fifa-card/${userId}/image`)
      if (!res.ok) throw new Error('image fetch failed')
      const blob = await res.blob()
      const fileName = `${nickname.replace(/\s+/g, '-').toLowerCase()}-card.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName })
        setStatus('done')
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setStatus('done')
    } catch (err) {
      // The user cancelling the native share sheet also lands here (AbortError) — treat that as
      // a silent no-op rather than an error.
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('idle')
        return
      }
      setStatus('error')
    } finally {
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={status === 'working'}
      className="flex w-fit items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium transition hover:border-gold hover:text-gold disabled:opacity-50 dark:border-neutral-800"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" />
      </svg>
      {status === 'working'
        ? t('fifaCard.share.working')
        : status === 'done'
          ? t('fifaCard.share.download')
          : status === 'error'
            ? t('fifaCard.share.errorGeneric')
            : t('fifaCard.share.button')}
    </button>
  )
}

'use client'

import { useState } from 'react'
import { useTranslation } from '@/i18n/client'

type Member = {
  userId: string
  nickname: string
  role: 'owner' | 'member'
  accessCode: string | null
}

export default function InviteRow({
  spaceId,
  member,
  isOwner
}: {
  spaceId: string
  member: Member
  isOwner: boolean
}) {
  const { t } = useTranslation('app')
  const [accessCode, setAccessCode] = useState(member.accessCode)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canManageCode = isOwner && member.role !== 'owner'

  async function handleCopy() {
    if (!accessCode) return
    try {
      await navigator.clipboard.writeText(accessCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — code is still shown below.
    }
  }

  async function handleRegenerate() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/members/${member.userId}/access-code`, {
        method: 'POST'
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || t('settings.invites.row.regenerateError'))
        return
      }
      setAccessCode(data.accessCode)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{member.nickname}</p>
          <p className="text-neutral-500">{t(`space.role.${member.role}`)}</p>
        </div>
        {canManageCode && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!accessCode}
              className="rounded-md border border-neutral-300 px-3 py-1.5 disabled:opacity-50 dark:border-neutral-700"
            >
              {copied ? t('settings.invites.row.copied') : t('settings.invites.row.copyCode')}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="rounded-md border border-neutral-300 px-3 py-1.5 disabled:opacity-50 dark:border-neutral-700"
            >
              {loading ? t('settings.invites.row.regenerating') : t('settings.invites.row.regenerate')}
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {canManageCode && accessCode && (
        <code dir="ltr" className="w-fit truncate rounded bg-neutral-100 px-2 py-1 font-mono text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
          {accessCode}
        </code>
      )}
    </div>
  )
}

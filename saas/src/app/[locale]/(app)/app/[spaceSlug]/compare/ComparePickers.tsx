'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslation } from '@/i18n/client'

type Member = { userId: string; nickname: string }

export default function ComparePickers({
  members,
  selectedA,
  selectedB
}: {
  members: Member[]
  selectedA?: string
  selectedB?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation('app')

  function navigate(a?: string, b?: string) {
    const params = new URLSearchParams()
    if (a) params.set('a', a)
    if (b) params.set('b', b)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex gap-4">
      <select
        value={selectedA || ''}
        onChange={(e) => navigate(e.target.value, selectedB)}
        className="rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700"
      >
        <option value="">{t('compare.selectMemberPlaceholder')}</option>
        {members.map((m) => (
          <option key={m.userId} value={m.userId}>
            {m.nickname}
          </option>
        ))}
      </select>
      <span className="self-center text-sm text-neutral-500">{t('compare.vs')}</span>
      <select
        value={selectedB || ''}
        onChange={(e) => navigate(selectedA, e.target.value)}
        className="rounded-md border border-neutral-300 bg-transparent px-3 py-1.5 text-sm dark:border-neutral-700"
      >
        <option value="">{t('compare.selectMemberPlaceholder')}</option>
        {members.map((m) => (
          <option key={m.userId} value={m.userId}>
            {m.nickname}
          </option>
        ))}
      </select>
    </div>
  )
}

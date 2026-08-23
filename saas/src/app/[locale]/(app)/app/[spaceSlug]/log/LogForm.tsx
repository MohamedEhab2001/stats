'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { DIFF_EMOJI, type Difficulty } from '@/lib/domain/challenge-catalog'
import { LocaleLink, useLocale } from '@/i18n/navigation'
import { localeHref } from '@/i18n/href'
import { useTranslation } from '@/i18n/client'

type StatDef = { key: string; label: string; short: string; max: number; blurb: string }
type ActiveChallenge = {
  challengeId: string
  challenge: { title: string; description: string; difficulty: Difficulty; points: number }
}

// A tap-friendly –/+ stepper instead of a bare <input type="number"> — stat entries are small
// integers (0-40ish) that people fill in quickly on a phone after a match, so incrementing beats
// typing, and clamping to the stat's real max (space.statDefinitions[].max) rules out typos like
// an extra digit. Typing directly into the field still works for larger jumps.
function StatStepper({
  value,
  max,
  onChange
}: {
  value: string
  max: number
  onChange: (next: string) => void
}) {
  const numeric = Number(value) || 0

  function clamp(n: number) {
    return Math.min(max, Math.max(0, n))
  }

  return (
    <div className="flex items-center overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
      <button
        type="button"
        onClick={() => onChange(String(clamp(numeric - 1)))}
        disabled={numeric <= 0}
        aria-label="−1"
        className="flex h-10 w-10 shrink-0 items-center justify-center text-lg text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value === '' ? '' : String(clamp(Number(e.target.value))))}
        className="h-10 w-full min-w-0 flex-1 border-x border-neutral-300 bg-transparent text-center outline-none [appearance:textfield] dark:border-neutral-700 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(String(clamp(numeric + 1)))}
        disabled={numeric >= max}
        aria-label="+1"
        className="flex h-10 w-10 shrink-0 items-center justify-center text-lg text-neutral-500 transition hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
      >
        +
      </button>
    </div>
  )
}

export default function LogForm({
  spaceId,
  spaceSlug,
  statDefs,
  defaultDate
}: {
  spaceId: string
  spaceSlug: string
  statDefs: StatDef[]
  defaultDate: string
}) {
  const router = useRouter()
  const locale = useLocale()
  const { t } = useTranslation('app')
  const [date, setDate] = useState(defaultDate)
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(statDefs.map((s) => [s.key, '']))
  )
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallenge | null>(null)
  const [challengeCompleted, setChallengeCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/spaces/${spaceId}/challenges/active`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setActiveChallenge(data?.active ?? null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [spaceId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const weekRes = await fetch(`/api/spaces/${spaceId}/weeks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      })
      const weekData = await weekRes.json().catch(() => ({}))
      if (!weekRes.ok) {
        setError(weekData.error || t('log.errorWeek'))
        return
      }

      const stats = Object.fromEntries(statDefs.map((s) => [s.key, Number(values[s.key]) || 0]))
      const payload = activeChallenge ? { ...stats, challengeCompleted } : stats

      const entryRes = await fetch(`/api/spaces/${spaceId}/weeks/${weekData.id}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const entryData = await entryRes.json().catch(() => ({}))
      if (!entryRes.ok) {
        setError(entryData.error || t('log.errorEntry'))
        return
      }

      router.push(localeHref(locale, `/app/${spaceSlug}`))
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {t('log.dateLabel')}
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      {statDefs.length === 0 ? (
        <p className="text-sm text-neutral-500">{t('log.noStatDefs')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {statDefs.map((s) => (
            <div
              key={s.key}
              className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{s.label}</span>
                <span className="shrink-0 text-xs text-neutral-400" dir="ltr">
                  {t('log.maxHint', { max: s.max })}
                </span>
              </div>
              {s.blurb && <p className="text-xs text-neutral-500">{s.blurb}</p>}
              <StatStepper
                value={values[s.key]}
                max={s.max}
                onChange={(next) => setValues((v) => ({ ...v, [s.key]: next }))}
              />
            </div>
          ))}
        </div>
      )}

      {activeChallenge && (
        <div className="rounded-lg border border-gold/40 bg-gold-dim p-3">
          <p className="text-sm font-medium">
            {DIFF_EMOJI[activeChallenge.challenge.difficulty]} {activeChallenge.challenge.title}
            <span className="ms-2 text-xs font-normal text-neutral-500">
              {t(`challenges.difficulty.${activeChallenge.challenge.difficulty}`)} &middot;{' '}
              {t('challenges.pointsSuffix', { points: activeChallenge.challenge.points })}
            </span>
          </p>
          <p className="mt-1 text-sm text-neutral-500">{activeChallenge.challenge.description}</p>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={challengeCompleted}
              onChange={(e) => setChallengeCompleted(e.target.checked)}
              className="accent-gold"
            />
            {t('log.challengeCheckboxLabel')}
          </label>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-gold px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-gold-soft disabled:opacity-50"
        >
          {loading ? t('log.submitting') : t('log.submit')}
        </button>
        <LocaleLink
          href={`/app/${spaceSlug}`}
          className="rounded-md border border-neutral-200 px-4 py-2.5 text-sm text-neutral-500 transition hover:text-neutral-900 dark:border-neutral-800 dark:hover:text-neutral-100"
        >
          {t('log.cancel')}
        </LocaleLink>
      </div>
    </form>
  )
}

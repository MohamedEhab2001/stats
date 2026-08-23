'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/client'

type StatDef = {
  key: string
  label: string
  short: string
  max: number
  weight: number
  higherIsBetter: boolean
  blurb: string
  enabled: boolean
  isCustom: boolean
}

const emptyForm = { key: '', label: '', short: '', max: '20', weight: '1', higherIsBetter: true, blurb: '' }

export default function StatDefinitionsManager({
  spaceId,
  isOwner,
  initialDefs
}: {
  spaceId: string
  isOwner: boolean
  initialDefs: StatDef[]
}) {
  const router = useRouter()
  const { t } = useTranslation('app')
  const [defs, setDefs] = useState<StatDef[]>(initialDefs)
  const [error, setError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [addLoading, setAddLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  async function handleToggle(key: string, enabled: boolean) {
    setError(null)
    setBusyKey(key)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/stat-defs/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || t('settings.statAttributes.errors.toggle'))
        return
      }
      setDefs((prev) => prev.map((d) => (d.key === key ? { ...d, enabled } : d)))
      router.refresh()
    } finally {
      setBusyKey(null)
    }
  }

  async function handleDelete(key: string) {
    setError(null)
    setBusyKey(key)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/stat-defs/${key}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || t('settings.statAttributes.errors.delete'))
        return
      }
      setDefs((prev) => prev.filter((d) => d.key !== key))
      router.refresh()
    } finally {
      setBusyKey(null)
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setAddLoading(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/stat-defs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: form.key,
          label: form.label,
          short: form.short,
          max: Number(form.max),
          weight: Number(form.weight),
          higherIsBetter: form.higherIsBetter,
          blurb: form.blurb
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || t('settings.statAttributes.errors.add'))
        return
      }
      setDefs((prev) => [...prev, data.statDefinition])
      setForm(emptyForm)
      setAddOpen(false)
      router.refresh()
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-col divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {defs.map((d) => (
          <div key={d.key} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium">{d.label}</span>
                <span className="text-xs text-neutral-500">({d.short})</span>
                <span
                  className={
                    d.isCustom
                      ? 'rounded-full bg-gold-dim px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold'
                      : 'rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:bg-neutral-800'
                  }
                >
                  {d.isCustom ? t('settings.statAttributes.custom') : t('settings.statAttributes.builtIn')}
                </span>
              </div>
              {d.blurb && <p className="text-xs text-neutral-500">{d.blurb}</p>}
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-neutral-500">
                <input
                  type="checkbox"
                  checked={d.enabled}
                  disabled={!isOwner || busyKey === d.key}
                  onChange={(e) => handleToggle(d.key, e.target.checked)}
                  className="accent-gold"
                />
                {t('settings.statAttributes.enabledLabel')}
              </label>
              {isOwner && d.isCustom && (
                <button
                  onClick={() => handleDelete(d.key)}
                  disabled={busyKey === d.key}
                  className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 disabled:opacity-50 dark:border-red-900 dark:text-red-400"
                >
                  {t('settings.statAttributes.delete')}
                </button>
              )}
            </div>
          </div>
        ))}
        {defs.length === 0 && (
          <p className="px-4 py-3 text-sm text-neutral-500">{t('settings.statAttributes.noneYet')}</p>
        )}
      </div>

      {isOwner && (
        <div className="flex flex-col gap-3">
          {!addOpen ? (
            <button
              onClick={() => setAddOpen(true)}
              className="w-fit rounded-md border border-gold px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold-dim"
            >
              {t('settings.statAttributes.addCta')}
            </button>
          ) : (
            <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  {t('settings.statAttributes.form.keyLabel')}
                  <input
                    required
                    placeholder={t('settings.statAttributes.form.keyPlaceholder')}
                    value={form.key}
                    onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  {t('settings.statAttributes.form.labelLabel')}
                  <input
                    required
                    placeholder={t('settings.statAttributes.form.labelPlaceholder')}
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  {t('settings.statAttributes.form.shortLabel')}
                  <input
                    required
                    placeholder={t('settings.statAttributes.form.shortPlaceholder')}
                    value={form.short}
                    onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  {t('settings.statAttributes.form.maxLabel')}
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.max}
                    onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  {t('settings.statAttributes.form.weightLabel')}
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={form.weight}
                    onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </label>
                <label className="mt-6 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.higherIsBetter}
                    onChange={(e) => setForm((f) => ({ ...f, higherIsBetter: e.target.checked }))}
                    className="accent-gold"
                  />
                  {t('settings.statAttributes.form.higherIsBetterLabel')}
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                {t('settings.statAttributes.form.blurbLabel')}
                <input
                  value={form.blurb}
                  onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))}
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold-soft disabled:opacity-50"
                >
                  {addLoading
                    ? t('settings.statAttributes.form.submitting')
                    : t('settings.statAttributes.form.submit')}
                </button>
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
                >
                  {t('settings.statAttributes.form.cancel')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

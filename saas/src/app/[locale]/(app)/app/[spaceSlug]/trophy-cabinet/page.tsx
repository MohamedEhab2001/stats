import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { getTrophyCabinetForSpace } from '@/lib/services/trophyCabinet'
import { BadgeIcon } from '@/lib/domain/badges'
import { PRIZE_META, PRIZE_KEYS_MONTHLY } from '@/lib/stats-engine/tournaments'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'

const MEDAL = ['🥇', '🥈', '🥉']

const PRIZE_EMOJI: Record<string, string> = {
  goldenBoot: '⚽',
  goldenVision: '🎯',
  goldenSkills: '✨',
  winner: '🏆',
  playerOfMonth: '⭐'
}

export default async function TrophyCabinetPage({
  params
}: {
  params: Promise<{ locale: string; spaceSlug: string }>
}) {
  const { locale: rawLocale, spaceSlug } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { space } = await requireSpaceMembership(locale, spaceSlug)
  const members = await getTrophyCabinetForSpace(String(space._id))

  const totalOf = (m: (typeof members)[number]) =>
    PRIZE_KEYS_MONTHLY.reduce((sum, key) => sum + (m.trophies[key]?.length ?? 0), 0)

  const ranked = [...members].sort((a, b) => totalOf(b) - totalOf(a))

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">{t('app:trophyCabinet.title')}</h1>

      {ranked.length === 0 ? (
        <p className="text-sm text-neutral-500">{t('app:trophyCabinet.noMembers')}</p>
      ) : (
        ranked.map((m, i) => {
          const total = totalOf(m)
          return (
            <section
              key={m.userId}
              className={`flex flex-col gap-4 rounded-xl border p-5 ${
                total > 0 && i === 0
                  ? 'border-gold/40 bg-gradient-to-br from-gold-dim to-transparent'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-lg font-bold text-neutral-500 dark:bg-neutral-900">
                  {total > 0 && i < 3 ? MEDAL[i] : m.nickname.trim().charAt(0).toUpperCase()}
                </span>
                <h2 className="flex-1 text-lg font-medium">{m.nickname}</h2>
                <span
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
                    total > 0 ? 'bg-gold text-ink' : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-900'
                  }`}
                >
                  🏆 {total}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PRIZE_KEYS_MONTHLY.map((key) => {
                  const trophies = m.trophies[key] ?? []
                  const hasAny = trophies.length > 0
                  return (
                    <div
                      key={key}
                      className={`flex flex-col gap-2 rounded-lg border p-3 ${
                        hasAny
                          ? 'border-neutral-200 dark:border-neutral-800'
                          : 'border-dashed border-neutral-200 opacity-60 dark:border-neutral-800'
                      }`}
                    >
                      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500">
                        <span aria-hidden>{PRIZE_EMOJI[key]}</span>
                        {PRIZE_META[key].label}
                        {hasAny && <span className="ms-auto text-xs text-gold">×{trophies.length}</span>}
                      </h3>
                      {hasAny ? (
                        <ul className="flex flex-col gap-1.5">
                          {trophies.map((t2, idx) => (
                            <li key={`${t2.key}-${idx}`} className="flex items-center gap-2 text-sm">
                              <BadgeIcon badgeKey={t2.badge} size={18} className="shrink-0 text-gold" />
                              <span className="truncate">{t2.name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-neutral-400">{t('app:trophyCabinet.noneYet')}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}

import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { getStandingsForSpace } from '@/lib/services/matchWeeks'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import WindowPicker from './WindowPicker'

const MEDAL = ['🥇', '🥈', '🥉']
const AVATAR_HUES = ['text-gold', 'text-neutral-400', 'text-amber-600 dark:text-amber-500']

export default async function StandingsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; spaceSlug: string }>
  searchParams: Promise<{ window?: string }>
}) {
  const { locale: rawLocale, spaceSlug } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { window: windowParam } = await searchParams
  const { space } = await requireSpaceMembership(locale, spaceSlug)

  const window = windowParam === 'month' || windowParam === 'year' ? windowParam : 'all'
  const standings = await getStandingsForSpace(String(space._id), window)
  const topPIndex = Math.max(1, standings.rows[0]?.pIndex ?? 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('app:standings.title')}</h1>
        <WindowPicker current={window} />
      </div>

      {standings.rows.length === 0 ? (
        <p className="text-sm text-neutral-500">{t('app:standings.noStats')}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-start text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <th className="px-4 py-3">{t('app:standings.columns.rank')}</th>
                  <th className="px-4 py-3">{t('app:standings.columns.member')}</th>
                  <th className="px-4 py-3">{t('app:standings.columns.pIndex')}</th>
                  <th className="px-4 py-3" dir="ltr">
                    W
                  </th>
                  <th className="px-4 py-3" dir="ltr">
                    D
                  </th>
                  <th className="px-4 py-3" dir="ltr">
                    L
                  </th>
                  <th className="px-4 py-3">{t('app:standings.columns.played')}</th>
                  {standings.statDefs.map((s) => (
                    <th key={s.key} className="px-4 py-3 font-normal normal-case text-neutral-400">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings.rows.map((row, i) => (
                  <tr
                    key={row.userId}
                    className="border-b border-neutral-100 transition last:border-0 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/40"
                  >
                    <td className="px-4 py-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold dark:bg-neutral-900">
                        {i < 3 ? MEDAL[i] : i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold dark:bg-neutral-900 ${
                            i < 3 ? AVATAR_HUES[i] : 'text-neutral-500'
                          }`}
                        >
                          {row.nickname.trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium">{row.nickname}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span dir="ltr">{row.pIndex.toFixed(1)}</span>
                        <span className="h-1 w-16 overflow-hidden rounded-full bg-gold-dim">
                          <span
                            className="block h-full rounded-full bg-gold"
                            style={{ width: `${Math.max(2, (Math.max(0, row.pIndex) / topPIndex) * 100)}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-green-600/15 px-1.5 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400">
                        {row.wins}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-neutral-500/15 px-1.5 py-0.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                        {row.draws}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-red-600/15 px-1.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">
                        {row.losses}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{row.played}</td>
                    {standings.statDefs.map((s) => (
                      <td key={s.key} className="px-4 py-3 text-neutral-500">
                        {row.totals[s.key] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

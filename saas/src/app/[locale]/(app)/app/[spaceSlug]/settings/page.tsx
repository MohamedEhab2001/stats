import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { countActiveMembers } from '@/lib/services/memberships'
import { LocaleLink } from '@/i18n/navigation'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import RenameForm from './RenameForm'

function NavIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-gold"
    >
      <path d={path} />
    </svg>
  )
}

const ICONS = {
  members: 'M17 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M13 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm7 13v-1a3.5 3.5 0 0 0-2.5-3.4M16.5 3.6A3 3 0 0 1 18 9',
  attributes: 'M4 19V5M4 19h16M8 15l3-4 3 3 4-6',
  billing: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 4h18M7 15h4'
} as const

export default async function SettingsPage({
  params
}: {
  params: Promise<{ locale: string; spaceSlug: string }>
}) {
  const { locale: rawLocale, spaceSlug } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { space, membership } = await requireSpaceMembership(locale, spaceSlug)
  const activeCount = await countActiveMembers(String(space._id))
  const cap = space.plan!.memberCap
  const seatPct = cap > 0 ? Math.min(100, (activeCount / cap) * 100) : 0

  const NAV_LINKS = [
    ...(membership.role === 'owner'
      ? [{ href: 'invites', icon: ICONS.members, label: t('app:settings.manageInvites') }]
      : []),
    { href: 'stat-attributes', icon: ICONS.attributes, label: t('app:settings.statAttributesLink') },
    { href: 'billing', icon: ICONS.billing, label: t('app:settings.billingLink') }
  ]

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('app:settings.title')}</h1>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500 dark:bg-neutral-900">
          {t(`app:space.role.${membership.role}`)}
        </span>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-500">{t('app:settings.spaceNameHeading')}</h2>
        {membership.role === 'owner' ? (
          <RenameForm spaceId={String(space._id)} currentName={space.name} />
        ) : (
          <p className="font-medium">{space.name}</p>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-500">{t('app:settings.planHeading')}</h2>
          <span className="rounded-full bg-gold-dim px-2.5 py-0.5 text-xs font-semibold text-gold">
            {t(`app:plan.${space.plan!.tier}`)}
          </span>
        </div>
        <p className="text-sm text-neutral-500" dir="ltr">
          {activeCount} / {cap}
        </p>
        <span className="h-1.5 w-full overflow-hidden rounded-full bg-gold-dim">
          <span className="block h-full rounded-full bg-gold" style={{ width: `${Math.max(2, seatPct)}%` }} />
        </span>
      </section>

      <section className="flex flex-col gap-2">
        {NAV_LINKS.map((link) => (
          <LocaleLink
            key={link.href}
            href={`/app/${space.slug}/settings/${link.href}`}
            className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4 transition hover:border-gold dark:border-neutral-800"
          >
            <NavIcon path={link.icon} />
            <span className="flex-1 text-sm font-medium">{link.label}</span>
          </LocaleLink>
        ))}
      </section>
    </div>
  )
}

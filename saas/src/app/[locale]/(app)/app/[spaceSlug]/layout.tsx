import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { listMySpaces } from '@/lib/services/spaces'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import LocaleSwitcher from '@/i18n/LocaleSwitcher'
import SpaceSwitcher from './SpaceSwitcher'
import SignOutButton from '@/components/SignOutButton'
import TabNav from './TabNav'

export default async function SpaceLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string; spaceSlug: string }>
}) {
  const { locale: rawLocale, spaceSlug } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { session, space, membership } = await requireSpaceMembership(locale, spaceSlug)

  const mySpaces = await listMySpaces(session.user.id)

  const TABS: { href: string; label: string }[] = [
    { href: '', label: t('app:nav.overview') },
    { href: '/standings', label: t('app:nav.standings') },
    { href: '/compare', label: t('app:nav.compare') },
    { href: '/tournaments', label: t('app:nav.tournaments') },
    { href: '/challenges', label: t('app:nav.challenges') },
    { href: '/scouting', label: t('app:nav.scouting') },
    { href: '/trophy-cabinet', label: t('app:nav.trophyCabinet') },
    { href: '/settings', label: t('app:nav.settings') }
  ]

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <SpaceSwitcher
            current={{ slug: space.slug, name: space.name }}
            spaces={mySpaces.map(({ space: s }) => ({ slug: s.slug, name: s.name }))}
          />
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-500">{membership.nickname}</span>
            <SignOutButton />
            <LocaleSwitcher />
          </div>
        </div>
        <TabNav spaceSlug={space.slug} tabs={TABS} />
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  )
}

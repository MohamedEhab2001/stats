import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { localeHref } from '@/i18n/href'
import type { Locale } from '@/i18n/settings'
import { getSpaceBySlug } from './spaces'
import { getActiveMembership } from './memberships'

/** Shared guard for every page under app/(app)/app/[spaceSlug]/*: requires a session, requires
 * the Space to exist, and requires the signed-in user to have an active Membership in it. */
export async function requireSpaceMembership(locale: Locale, spaceSlug: string) {
  const session = await auth()
  if (!session?.user?.id) redirect(localeHref(locale, '/login'))

  const space = await getSpaceBySlug(spaceSlug)
  if (!space) notFound()

  const membership = await getActiveMembership(String(space._id), session.user.id)
  if (!membership) notFound()

  return { session, space, membership }
}

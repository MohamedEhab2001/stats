import { requireSpaceMembership } from '@/lib/services/spaceAccess'
import { listMembers } from '@/lib/services/memberships'
import { LocaleLink } from '@/i18n/navigation'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'
import CreateInviteForm from './CreateInviteForm'
import InviteRow from './InviteRow'

// Space Members are added directly (email + nickname) and get a permanent access code
// immediately — there's no separate pending-invite step anymore. This page is the member
// management surface: everyone sees the roster, only the owner (Space Manager) can add members,
// see access codes, or regenerate them.
export default async function MembersPage({
  params
}: {
  params: Promise<{ locale: string; spaceSlug: string }>
}) {
  const { locale: rawLocale, spaceSlug } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)
  const { space, membership } = await requireSpaceMembership(locale, spaceSlug)

  const spaceId = String(space._id)
  const isOwner = membership.role === 'owner'
  const members = await listMembers(spaceId)

  const activeCount = members.length
  const memberCap = space.plan!.memberCap!
  const maxMemberCap = space.plan!.maxMemberCap!
  const pricePerExtraSeatEGP = space.plan!.pricePerExtraSeatEGP!
  const isFull = activeCount >= maxMemberCap
  const isBillable = activeCount >= memberCap

  return (
    <div className="flex max-w-lg flex-col gap-8">
      <h1 className="text-2xl font-semibold">{t('app:settings.invites.title')}</h1>

      <div className="flex flex-col gap-1">
        <p className="text-sm text-neutral-500">
          {t('app:settings.invites.seatsUsed', { active: activeCount, cap: memberCap })}
        </p>
        {isFull ? (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {t('app:settings.invites.spaceFull')}
          </p>
        ) : (
          isBillable && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t('app:settings.invites.nextSeatPrice', { price: pricePerExtraSeatEGP })}{' '}
              <LocaleLink
                href={`/app/${space.slug}/settings/billing`}
                className="font-medium underline"
              >
                {t('app:settings.invites.create.upgradeShort')}
              </LocaleLink>
            </p>
          )
        )}
      </div>

      {isOwner ? (
        !isFull && <CreateInviteForm spaceId={spaceId} />
      ) : (
        <p className="text-sm text-neutral-500">{t('app:settings.invites.ownerOnly')}</p>
      )}

      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <InviteRow
            key={m.userId}
            spaceId={spaceId}
            isOwner={isOwner}
            member={{
              userId: m.userId,
              nickname: m.nickname,
              role: m.role,
              accessCode: isOwner ? m.accessCode : null
            }}
          />
        ))}
      </div>
    </div>
  )
}

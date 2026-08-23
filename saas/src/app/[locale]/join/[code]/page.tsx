import { notFound } from 'next/navigation'
import { getInviteInfo } from '@/lib/services/invites'
import { LocaleLink } from '@/i18n/navigation'
import { getT } from '@/i18n/server'
import { isLocale, type Locale } from '@/i18n/settings'

// Public, purely informational: membership is created the moment a Space Manager adds someone
// (see lib/services/invites.ts's createInvite), so there's no "redeem" action left to take here —
// this just confirms it happened and points at the Space Member login.
export default async function JoinPage({
  params
}: {
  params: Promise<{ locale: string; code: string }>
}) {
  const { locale: rawLocale, code } = await params
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'ar'
  const { t } = await getT(locale)

  const invite = await getInviteInfo(code)
  if (!invite) notFound()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6 py-16 text-center text-white">
      {invite.status === 'revoked' || invite.status === 'expired' ? (
        <p className="text-white/60">
          {t('auth:join.statusNotPendingPrefix')} {t(`auth:join.status.${invite.status}`)}.
        </p>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">
            {t('auth:join.alreadyMemberPrefix')}{' '}
            <span className="font-bold text-gold">{invite.spaceName}</span>{' '}
            {t('auth:join.asPrefix')} <span className="font-medium">{invite.nickname}</span>
          </h1>
          <p className="text-white/60">
            {invite.email
              ? t('auth:join.loginHint', { email: invite.email })
              : t('auth:join.loginHintGeneric')}
          </p>
          <LocaleLink
            href="/login?mode=member"
            className="rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold-soft"
          >
            {t('auth:join.logIn')}
          </LocaleLink>
        </>
      )}
    </div>
  )
}

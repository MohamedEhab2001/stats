import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { defaultLocale, isLocale } from '@/i18n/settings'

function localeFromPathname(pathname: string): string | null {
  const [, first] = pathname.split('/')
  return first && isLocale(first) ? first : null
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // 1. Every user-facing route lives under /[locale]/... (see src/app/[locale]). A path with no
  // recognized locale prefix (including the bare `/`) gets redirected to the default locale,
  // Arabic, preserving whatever followed.
  const locale = localeFromPathname(pathname)
  if (!locale) {
    const url = req.nextUrl.clone()
    url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`
    return NextResponse.redirect(url)
  }

  // 2. Auth guard for /[locale]/app/*, replacing the old /app/:path* matcher. Redirect to that
  // same locale's /login (not a bare /login) so the user doesn't lose their language.
  const appBase = `/${locale}/app`
  const isAppRoute = pathname === appBase || pathname.startsWith(`${appBase}/`)
  if (isAppRoute && !req.auth) {
    const loginUrl = new URL(`/${locale}/login`, req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  // Run on every page route but skip API routes (unprefixed by design), Next internals, and
  // static assets — matches the negative-lookahead pattern from Next's own i18n routing guide.
  matcher: ['/((?!api|_next|favicon.ico|.*\\..*).*)']
}

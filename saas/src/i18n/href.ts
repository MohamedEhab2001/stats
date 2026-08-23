import type { Locale } from './settings'

// Plain, framework-agnostic helper — deliberately has no 'use client' directive so it can be
// imported from Server Components (redirect(), generateMetadata, etc.) as well as client code.
// Prefixes a locale-less internal path (e.g. `/app/${slug}`, or `/` for the home page) with the
// given locale segment. Every internal href/redirect/router.push in this app should go through
// this (directly, or via the LocaleLink/useLocale wrappers in ./navigation) instead of hardcoding
// a bare path — that's what keeps navigation inside the current locale.
export function localeHref(locale: Locale, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`
}

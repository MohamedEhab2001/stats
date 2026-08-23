'use client'

import { forwardRef } from 'react'
import Link, { type LinkProps } from 'next/link'
import { useParams } from 'next/navigation'
import { defaultLocale, isLocale, type Locale } from './settings'
import { localeHref } from './href'

/** Reads the current locale out of the `[locale]` route param. Client-side only. */
export function useLocale(): Locale {
  const params = useParams<{ locale?: string }>()
  const raw = params?.locale
  return typeof raw === 'string' && isLocale(raw) ? raw : defaultLocale
}

type LocaleLinkProps = Omit<LinkProps, 'href'> & {
  href: string
  className?: string
  children?: React.ReactNode
}

/**
 * Drop-in replacement for `next/link` for every internal, locale-less path in this app
 * (e.g. `href="/login"`, `href={`/app/${slug}`}`) — it reads the active locale from the route
 * and prefixes the href automatically. Safe to render from Server Components too (it's just
 * another client component in the tree).
 */
export const LocaleLink = forwardRef<HTMLAnchorElement, LocaleLinkProps>(function LocaleLink(
  { href, ...props },
  ref
) {
  const locale = useLocale()
  return <Link ref={ref} href={localeHref(locale, href)} {...props} />
})

export { localeHref }

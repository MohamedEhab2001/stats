// Central i18n config: the list of supported locales, the default one, and the namespaces
// every locale must provide. Add a new locale or namespace here first — everything else
// (routing, resource loading, the locale switcher) derives from these three exports.

export const locales = ['ar', 'en'] as const
export type Locale = (typeof locales)[number]

// Arabic is the default: a bare `/` (and any unprefixed path) redirects here — see src/proxy.ts.
export const defaultLocale: Locale = 'ar'

export const namespaces = ['common', 'marketing', 'auth', 'app'] as const
export type Namespace = (typeof namespaces)[number]

export const defaultNamespace: Namespace = 'common'

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

export function dirForLocale(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

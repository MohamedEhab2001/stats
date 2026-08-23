'use client'

import i18next, { type i18n as I18nInstance } from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { resources } from './resources'
import { defaultNamespace, namespaces, type Locale } from './settings'

// One i18next instance per browser tab, lazily created and reused across client-side
// navigations. When the user switches locale (see LocaleSwitcher), the [locale] layout re-renders
// with a new `locale` prop rather than remounting — so we just call changeLanguage() on the
// existing instance instead of re-initializing it.
let clientInstance: I18nInstance | null = null

function getClientInstance(locale: Locale) {
  if (!clientInstance) {
    clientInstance = i18next.createInstance()
    clientInstance.use(initReactI18next).init({
      lng: locale,
      fallbackLng: 'ar',
      ns: namespaces,
      defaultNS: defaultNamespace,
      resources,
      interpolation: { escapeValue: false },
      react: { useSuspense: false }
    })
  } else if (clientInstance.language !== locale) {
    clientInstance.changeLanguage(locale)
  }
  return clientInstance
}

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const instance = getClientInstance(locale)
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>
}

// Re-exported so every client component imports `useTranslation` from this one module instead of
// reaching into 'react-i18next' directly — keeps the client i18next setup a single source of truth.
export { useTranslation } from 'react-i18next'

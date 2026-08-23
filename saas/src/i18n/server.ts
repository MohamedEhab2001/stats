import 'server-only'
import i18next from 'i18next'
import { resources } from './resources'
import { defaultNamespace, namespaces, type Locale } from './settings'

// Server Components can't use hooks, so this hands back a plain, already-fixed `t` function
// instead of a hook. A fresh instance per call is intentional and cheap — resources are static
// in-memory JSON, there's no I/O, and it keeps requests from different locales from ever sharing
// mutable i18next state.
export async function getT(locale: Locale) {
  const instance = i18next.createInstance()
  await instance.init({
    lng: locale,
    fallbackLng: 'ar',
    ns: namespaces,
    defaultNS: defaultNamespace,
    resources,
    interpolation: { escapeValue: false }
  })
  return { t: instance.t, i18n: instance }
}

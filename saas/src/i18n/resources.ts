// Static resource bundle — every namespace, for every locale, imported directly (no runtime
// fetch/backend plugin needed since the whole catalog is a handful of small JSON files). Shared
// by both the server (src/i18n/server.ts) and client (src/i18n/client.tsx) i18next instances so
// they never drift apart. No 'server-only'/'use client' marker here on purpose — plain data, safe
// to import from either world.
import common_ar from './locales/ar/common.json'
import marketing_ar from './locales/ar/marketing.json'
import auth_ar from './locales/ar/auth.json'
import app_ar from './locales/ar/app.json'
import common_en from './locales/en/common.json'
import marketing_en from './locales/en/marketing.json'
import auth_en from './locales/en/auth.json'
import app_en from './locales/en/app.json'

export const resources = {
  ar: { common: common_ar, marketing: marketing_ar, auth: auth_ar, app: app_ar },
  en: { common: common_en, marketing: marketing_en, auth: auth_en, app: app_en }
} as const

import en from './en.json'
import hu from './hu.json'

export const locales = ['hu', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'hu'

const messages = { hu, en }

export const contactEmail = 'kapcsolat@svk.bme.hu'

/** Looks up a UI string by dotted key, e.g. t('en', 'common.routes.home'). */
export function t(locale: Locale, key: string): string {
  const value = key
    .split('.')
    .reduce<unknown>((obj, part) => (obj as Record<string, unknown>)?.[part], messages[locale])
  if (typeof value !== 'string') throw new Error(`Missing translation: ${locale}.${key}`)
  return value
}

/** Prefixes a site path with the locale, e.g. ('en', '/events') -> '/en/events'. */
export function localePath(locale: Locale, path: string): string {
  if (locale === defaultLocale) return path
  return path === '/' ? `/${locale}/` : `/${locale}${path}`
}

/** Strips the locale prefix from a pathname, e.g. '/en/events/' -> '/events'. */
export function pathWithoutLocale(pathname: string): string {
  const stripped = pathname.replace(/^\/en(?=\/|$)/, '').replace(/(.)\/$/, '$1')
  return stripped || '/'
}

/** Hungarian text with the English translation if there is one. */
export function localizedText(locale: Locale, hungarian?: string, english?: string): string {
  if (!hungarian) return ''
  return locale === 'en' && english ? english : hungarian
}

/** Hungarian name order is "Last First". */
export function formatName(locale: Locale, firstName: string, lastName: string): string {
  return locale === 'en' ? `${firstName} ${lastName}` : `${lastName} ${firstName}`
}

/** "2025.03.18 10:00" in Budapest time. */
export function formatDateTime(date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Budapest',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  )
  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`
}

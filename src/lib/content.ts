import { getCollection, type CollectionEntry } from 'astro:content'
import { localePath, type Locale } from '~/i18n'

export type Event = CollectionEntry<'events'>
export type Member = CollectionEntry<'members'>

// The site is static, so "now" is the build time. The deploy workflow
// rebuilds daily so date dependent events move to "past" on time.
const buildTime = new Date()

export function isCurrentEvent(event: Event, now = buildTime): boolean {
  const { isActive, datetime } = event.data
  if (isActive === 'active') return true
  if (isActive === 'inactive') return false
  return datetime !== undefined && datetime.getTime() >= now.getTime()
}

const time = (e: Event) => e.data.datetime?.getTime() ?? 0

/** Current events (soonest first) and past events (newest first). */
export async function getEvents() {
  const events = await getCollection('events')
  return {
    current: events.filter((e) => isCurrentEvent(e)).sort((a, b) => time(a) - time(b)),
    past: events.filter((e) => !isCurrentEvent(e)).sort((a, b) => time(b) - time(a)),
  }
}

/** Events for the home page carousel: current ones, padded with past ones to at least 3. */
export async function getCarouselEvents(minimum = 3) {
  const { current, past } = await getEvents()
  return [...current, ...past.slice(0, Math.max(0, minimum - current.length))]
}

export async function getMembers() {
  const members = await getCollection('members')
  return members.sort((a, b) => a.data.orderPriority - b.data.orderPriority)
}

/** Where an event tile links to: its external link if set, otherwise its own page. */
export function eventHref(locale: Locale, event: Event): string {
  return event.data.externalLink ?? localePath(locale, `/event/${event.id}`)
}

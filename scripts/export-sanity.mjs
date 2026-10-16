// One-time (re-runnable) export of the Sanity content into src/content.
//
//   npm run export:sanity
//
// Reads the public Sanity dataset over HTTP (no token needed), writes one YAML
// file per document and downloads the images next to it (crop applied, resized).
// WARNING: it wipes and regenerates src/content/{events,members,pictures}, so
// any edits made to those files after the export are overwritten.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const projectId = process.env.SANITY_PROJECT_ID ?? '1shcjrfh'
const dataset = process.env.SANITY_DATASET ?? 'production'
const apiVersion = '2023-06-21'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = path.join(root, 'src', 'content')

async function query(groq) {
  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`)
  url.searchParams.set('query', groq)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`)
  return (await res.json()).result
}

// Builds a CDN url for an image field, applying the editor's crop like
// @sanity/image-url does, and capping the width (never upscales).
// `format: 'jpg'` re-encodes photos, which are much smaller than PNG.
function imageUrl(image, maxWidth, format) {
  const [, id, dims, ext] = image.asset._ref.split('-')
  const [w, h] = dims.split('x').map(Number)
  const params = new URLSearchParams()
  if (image.crop) {
    const { left, right, top, bottom } = image.crop
    const rect = [
      Math.round(left * w),
      Math.round(top * h),
      Math.round((1 - left - right) * w),
      Math.round((1 - top - bottom) * h),
    ]
    params.set('rect', rect.join(','))
  }
  if (ext !== 'svg') {
    params.set('w', String(maxWidth))
    params.set('fit', 'max')
    if (format) {
      params.set('fm', format)
      params.set('q', '85')
    }
  }
  return {
    url: `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dims}.${ext}?${params}`,
    ext: format && ext !== 'svg' ? format : ext,
  }
}

async function download(image, maxWidth, dir, name, format) {
  const { url, ext } = imageUrl(image, maxWidth, format)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Image download failed: ${url}`)
  const file = `${name}.${ext}`
  await fs.writeFile(path.join(dir, file), Buffer.from(await res.arrayBuffer()))
  return `./${file}`
}

// Drops empty values so the YAML files only contain what is set.
function clean(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  )
}

async function writeCollection(name, docs, toEntry) {
  const dir = path.join(contentDir, name)
  await fs.rm(dir, { recursive: true, force: true })
  await fs.mkdir(dir, { recursive: true })
  for (const doc of docs) {
    const { slug, data } = await toEntry(doc, dir)
    await fs.writeFile(path.join(dir, `${slug}.yaml`), YAML.stringify(clean(data)))
  }
  console.log(`${name}: ${docs.length}`)
}

const events = await query(`*[_type == 'event'] | order(datetime desc)`)
await writeCollection('events', events, async (e, dir) => {
  const slug = e.slug.current
  return {
    slug,
    data: {
      title: e.title,
      englishTitle: e.englishTitle,
      isActive: e.isActive,
      datetime: e.datetime,
      location: e.location,
      lecturer: e.lecturer,
      englishLecturer: e.englishLecturer,
      description: e.description,
      englishDescription: e.englishDescription,
      image: e.image?.asset ? await download(e.image, 1400, dir, slug) : undefined,
      imageAlt: e.image?.alt,
      spotLink: e.spotLink,
      externalLink: e.externalLink,
    },
  }
})

const members = await query(`*[_type == 'member'] | order(orderPriority asc)`)
await writeCollection('members', members, async (m, dir) => {
  const slug = m.slug.current
  return {
    slug,
    data: {
      firstName: m.firstName,
      lastName: m.lastName,
      position: m.position,
      englishPosition: m.englishPosition,
      orderPriority: m.orderPriority ?? 0,
      description: m.description,
      englishDescription: m.englishDescription,
      picture: m.picture?.asset ? await download(m.picture, 800, dir, slug, 'jpg') : undefined,
      pictureAlt: m.picture?.alt,
      linkedIn: m.linkedIn,
    },
  }
})

const pictures = await query(`*[_type == 'picture']`)
await writeCollection('pictures', pictures, async (p, dir) => {
  const slug = p.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return {
    slug,
    data: {
      title: p.title,
      description: p.description,
      image: await download(p.image, 2560, dir, slug, 'jpg'),
      alt: p.image.alt,
    },
  }
})

import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

// Mirrors the former Sanity schemas (sanity/schemaTypes in git history).
// Each entry is one YAML file; the file name is the slug used in the URL.
// Hungarian fields are the default, `english*` fields are optional translations.

const events = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/events' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      englishTitle: z.string().optional(),
      // active: always listed as current; inactive: always past;
      // dateDependent: current until `datetime` (evaluated at build time).
      isActive: z.enum(['active', 'inactive', 'dateDependent']).default('dateDependent'),
      datetime: z.coerce.date().optional(),
      location: z.string().optional(),
      lecturer: z.string().optional(),
      englishLecturer: z.string().optional(),
      description: z.string().optional(),
      englishDescription: z.string().optional(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      // Link of the Spot photo album, shown as a small icon on the event tile.
      spotLink: z.url().optional(),
      // If set, the event tile/carousel links here instead of the event page.
      externalLink: z.url().optional(),
    }),
})

const members = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/members' }),
  schema: ({ image }) =>
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      position: z.string().optional(),
      englishPosition: z.string().optional(),
      // Lower number comes first on the about page.
      orderPriority: z.number().default(0),
      description: z.string().optional(),
      englishDescription: z.string().optional(),
      picture: image().optional(),
      pictureAlt: z.string().optional(),
      linkedIn: z.url().optional(),
    }),
})

const pictures = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/pictures' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      image: image(),
      alt: z.string().optional(),
      description: z.string().optional(),
    }),
})

export const collections = { events, members, pictures }

# svk.bme.hu

Website of Schönherz Vállalati Kapcsolatok (SVK). A fully static [Astro](https://docs.astro.build/) site:
`npm run build` produces plain HTML/CSS/JS in `dist/`, which runs on any static file server
(GitHub Pages today, SVK's own VM with Caddy later). No server code, no runtime calls to
outside services, no analytics.

## Local development

Requirements: Node.js 24 LTS (see `.nvmrc`).

```sh
npm ci            # install the exact versions from package-lock.json
npm run dev       # dev server on http://localhost:4321
npm run build     # type check + static build into dist/
npm run preview   # serve dist/ locally
npm run format    # prettier
```

The build output works with any static server, e.g. `cd dist && python -m http.server`.

## Structure

```
src/
  content/            the site content (one YAML file per entry, images next to it)
    events/           events: <slug>.yaml -> /event/<slug>
    members/          members: <slug>.yaml -> /member/<slug>
    pictures/         other pictures (about page banner)
  content.config.ts   schemas of the content files
  i18n/               UI strings (hu.json, en.json) and language helpers
  pages/              routes: Hungarian at /, English at /en/
  views/              page bodies shared by both languages
  components/         navbar, footer, event tile, carousel, email pop-up, ...
  icons/              SVG icons and logos
public/               files copied as-is (favicons, Lottie animations, CNAME)
scripts/              export-sanity.mjs (one-time Sanity export)
```

## Languages and URLs

Hungarian is the default language and keeps the old URLs (`/`, `/events`, `/about`,
`/event/<slug>`, `/member/<slug>`). English is the same path under `/en/` (`/en/events`, ...).
The language switcher in the navbar links to the same page in the other language.

UI strings are in `src/i18n/hu.json` and `src/i18n/en.json`. Content has Hungarian fields
plus optional `english*` fields; when an English field is empty the Hungarian text is shown.

## Editing content

Edit the YAML files in `src/content/` (locally or in the GitHub web editor), commit to
`master`, and the site redeploys automatically. All fields are listed with comments in
`src/content.config.ts`; the build fails with a clear message if a file is invalid.

**Add an event:** create `src/content/events/<slug>.yaml` and put the image next to it:

```yaml
title: 24. Simonyi Konferencia
englishTitle: 24th Simonyi Conference
isActive: dateDependent # active | inactive | dateDependent
datetime: 2027-03-23T09:00:00.000Z # UTC; shown in Budapest time
location: BME I épület
lecturer: 20+
description: Magyarország legnagyobb egyetemi hallgatók által szervezett technológiai konferenciája.
image: ./24-simonyi-konferencia.png
spotLink: https://spot.sch.bme.hu/... # optional, photo album
externalLink: https://... # optional, tiles link here instead of the event page
```

`dateDependent` events count as current until their `datetime`. Because the site is static,
this is evaluated at build time; the deploy workflow rebuilds every night, so events move
to "past" by the next morning (or run the workflow manually).

**Add a member:** create `src/content/members/<slug>.yaml` (fields: `firstName`, `lastName`,
`position`, `englishPosition`, `orderPriority` (lower comes first), `description`,
`englishDescription`, `picture`, `linkedIn`).

Images are optimized (resized, converted to WebP) at build time, so originals can be added
as they are; keep them reasonably sized (max. ~2000 px wide). Only add images the site uses.

## Forms

The old contact / join us / event application forms posted to n8n, which is being retired.
Until a form service exists, the buttons open a pop-up showing `kapcsolat@svk.bme.hu`
(configured in `src/i18n/index.ts`). The old form code is in the git history (before the
Astro migration commit).

## Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `master`,
nightly, and on manual dispatch. `public/CNAME` sets the custom domain `svk.bme.hu`.
Pull requests get a build check (`check.yml`).

Repository settings needed once: _Settings → Pages → Source: GitHub Actions_, and the custom
domain `svk.bme.hu` (HTTPS enforced).

## Sanity export (historical)

The content was exported once from the former Sanity CMS with `npm run export:sanity`
(reads the public dataset, writes `src/content/` and downloads the images). Re-running it
**overwrites** `src/content/events`, `members` and `pictures`, so only use it if Sanity is
still the source of truth.

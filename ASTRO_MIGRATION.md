# svk.bme.hu: migration from Next.js to Astro

Working notes for rebuilding the SVK website as a static Astro site. Fill in the
**Decisions** section first; the rest is context for the build. Plan the implementation
yourself after reading the current code.

## Why

The current site (`svk-bme/svk-web`, Next.js 14 + Sanity) needs a running Node server
and external services. The long-term plan is a **fully static site** that runs on SVK's
own VM in the KSZK network (Caddy serving files, no server code for pages).
Until the VM is ready, the static output is hosted on **GitHub Pages** at `svk.bme.hu`.
The same build output must later move to the VM unchanged.

## Current site (what to port)

Repo: `svk-bme/svk-web` (fork of `kir-dev/svk-web`). Next.js 14 App Router, Tailwind,
NextUI, framer-motion, lottie, next-intl, Sanity.

**Pages**

| Route | Content |
| --- | --- |
| `/` | Home: current events (padded with previous ones to at least 3), partners, intro |
| `/about` | About us |
| `/events` | Event list |
| `/event/[slug]` | Event detail |
| `/member/[slug]` | Member detail |
| `/studio` | Sanity Studio (drop) |

**Content types in Sanity** (bilingual via separate English fields, not per-document translations)

| Type | Fields |
| --- | --- |
| `event` | title / englishTitle, slug, location, isActive, datetime, lecturer / englishLecturer, description / englishDescription, image, … |
| `member` | firstName, lastName, slug, position / englishPosition, orderPriority, description / englishDescription, picture, alt, linkedIn |
| `partner` | name, link, image, alt |
| `picture` | title, image, alt, description |

`posts.ndjson` in the repo holds 60 `post` documents (from 2013, Jekyll era). `post` is not in
the schema, so it is probably leftover from the Kir-Dev template. Confirm before dropping.

**Languages:** Hungarian (default) and English, UI strings in `messages/hu.json` and `messages/en.json`.
Today the language comes from a cookie read on the server; the static site needs URL-based languages.

**Forms** (`src/components/pop-up-components/`): contact, join us, event application. Field
definitions and validation in `src/utils/form-validation.ts`. All posted to `/api/form-submit`
→ n8n → Google Sheets. n8n is being dropped (its data is already saved).

**To drop:** Sanity Studio, `/api/revalidate`, draft mode, `/api/contact` (unused and broken),
nodemailer, axios, ngrok, Plausible. Check what `public/sw.js` and `public/service-worker.js` do before removing.

## Decisions (fill in)

| Question | Options | Answer |
| --- | --- | --- |
| New repo or rewrite inside `svk-web`? | New repo (e.g. `svk-bme/svk-site`) keeps the old one as reference | keep this one, commits will show the migration |
| Where does content live now? | **A:** one-time export from Sanity into Markdown/YAML in the repo (target state; recommended). **B:** Astro reads Sanity at build time for now | A |
| How is content edited until a CMS exists? | GitHub web editor on the content files / a later Sveltia CMS phase | not important now. either prepare for sveltia CMS or go with as easy as possible, even editing from code |
| Forms while on GitHub Pages | Reuse the MeetUp Cloudflare Pages Function (generalized, CORS for `svk.bme.hu`) / temporary email links / Google Form | temporarily just show the email. |
| Keep the current design 1:1, or allow a refresh? | | keep the current, no need to refresh now |
| Old URLs | Keep Hungarian URLs identical to today (`/events`, `/event/<slug>`, …), English under `/en/` (recommended) | it could either be, english under en/ or having english names for english and hun for hun. pick the objectivly better, or ask if not sure |

## Requirements

- **Astro, fully static output** (no SSR adapter). The `dist/` folder must run on any static server.
- **No runtime calls to outside services:** no Sanity at runtime, self-hosted fonts and images,
  no third-party analytics.
- **Minimal client JS:** Astro components by default; React (or other) islands only where
  interactivity is needed (carousel, form pop-ups, animations).
- **Both languages** with URL-based routing (Hungarian default at `/`, English at `/en/`),
  a language switcher, and the existing UI strings.
- **Same look and pages** as today unless decided otherwise; responsive; accessible.
- **Content** as Astro content collections with typed schemas mirroring the Sanity types.
  If option A: a re-runnable export script (Sanity → Markdown/YAML + downloaded images).
- **Images in the repo** only if the site uses them (team rule: unused images go to SVK's Drive
  or get deleted). Optimized at build time.
- **Old URLs keep working** (same paths, or redirects where a path changes).
- **Deployment:** GitHub Actions builds and deploys to GitHub Pages on push to `main`.
  Custom domain `svk.bme.hu` (a `CNAME` file in the output). The domain is currently attached to the
  `redirect` repo, so it moves to the new repo at cutover.
- **Pinned dependencies** and a current Node LTS; `README` explains local dev, content editing and deploy.

## Done when

- [ ] Every page from the table above exists in both languages and matches the current site.
- [ ] Content is complete: all events, members, partners and pictures, with images.
- [ ] Forms work through the chosen temporary backend, or show a clear alternative.
- [ ] `npm run build` produces a static `dist/` with no server code; it runs with `python -m http.server`.
- [ ] Lighthouse: no major accessibility or performance issues.
- [ ] Deployed to GitHub Pages; `svk.bme.hu` serves the new site; the redirect repo is retired.
- [ ] README updated; the old `svk-web` repo is archived (not deleted).

## Later (not in this task)

- Sveltia CMS for browser-based editing (login via `git.sch.bme.hu` or GitHub; prototype first).
- Moving the primary repo to `git.sch.bme.hu` with a GitHub mirror.
- Hosting on the SVK VM (Caddy), the shared form service, and GoatCounter analytics.

## Resources

- Astro docs: https://docs.astro.build/
- Content collections: https://docs.astro.build/en/guides/content-collections/
- i18n routing: https://docs.astro.build/en/guides/internationalization/
- Deploy to GitHub Pages: https://docs.astro.build/en/guides/deploy/github/
- Sanity export: `npx sanity dataset export <dataset> <file>.tar.gz` (in the `svk-web` repo, with project access)
- Long-term plan: "SVK web infrastructure – long-term design" doc

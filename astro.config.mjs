import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://svk.bme.hu',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    // /events -> /events/index.html: works on GitHub Pages, Caddy and python -m http.server
    format: 'directory',
  },
  i18n: {
    locales: ['hu', 'en'],
    defaultLocale: 'hu',
    routing: {
      // Hungarian keeps the old URLs (/events, /event/<slug>, ...), English lives under /en/
      prefixDefaultLocale: false,
    },
  },
  devToolbar: { enabled: false },
})

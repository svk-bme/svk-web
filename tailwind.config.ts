import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{astro,html,js,ts,md}'],
  theme: {
    extend: {
      colors: {
        cyan: '#3dcab1',
        svk_blue: '#071c42',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
    },
  },
} satisfies Config

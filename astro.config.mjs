// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL und MEDIA_HOST kommen aus der Umgebung (lokal .env, in CI als Variable),
// damit dieselbe Codebasis für Preview und Produktion gebaut werden kann.
const site = process.env.SITE_URL ?? 'https://example.invalid';
const mediaHost = process.env.MEDIA_HOST ?? 'media.example.invalid';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  image: {
    // Nur der zentrale Medienspeicher darf als Remote-Bildquelle dienen.
    remotePatterns: [{ protocol: 'https', hostname: mediaHost }],
  },
  build: { inlineStylesheets: 'auto' },
});

import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  output: 'static',
  integrations: [preact()],
  // quest.html statt quest/index.html: Firebase Hosting (cleanUrls) liefert /quest
  // dann ohne Redirect aus – wichtig für den Service Worker in Safari.
  build: { format: 'file' },
});

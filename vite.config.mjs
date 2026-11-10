import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { cpSync } from 'node:fs';
export default defineConfig({
  base: './',
  plugins: [{ name: 'static-content-assets', closeBundle() {
    // Content adapters use stable image paths; preserve these for static hosting.
    cpSync('assets/images', 'dist/assets/images', { recursive: true });
    for (const file of ['robots.txt', 'sitemap.xml', '.nojekyll']) cpSync(file, `dist/${file}`);
  } }],
  server: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
  build: { rollupOptions: { input: Object.fromEntries(
    ['index', 'layanan', 'produk', 'promo', 'kontak', '404'].map(page => [page, resolve(import.meta.dirname, `${page}.html`)])
  ) } }
});

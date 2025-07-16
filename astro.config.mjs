// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(), // Enable React components in Astro
    tailwind() // Enable Tailwind CSS
  ],
  // Configure site URL for production
  site: 'https://CodeTweak.osimify.com',
  // Enable SSR for better SEO
  output: 'server',
  // Configure build options
  build: {
    // Enable asset hashing for better caching
    assets: 'assets'
  }
});

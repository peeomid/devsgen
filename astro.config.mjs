// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(), // Enable React components in Astro
    tailwind(), // Enable Tailwind CSS
    sitemap() // Generate sitemap.xml
  ],
  // Configure site URL for production
  site: 'https://CodeTweak.osimify.com',
  // Static build for better performance
  output: 'static',
  // Configure build options
  build: {
    // Enable asset hashing for better caching
    assets: 'assets'
  }
});

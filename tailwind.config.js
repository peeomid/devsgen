/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',  // Blue
        secondary: '#6B7280', // Gray
        success: '#10B981',   // Green
        error: '#EF4444',     // Red
        background: '#F9FAFB', // Light gray
        text: '#1F2937',      // Dark gray
        accent: '#DBEAFE'      // Light blue
      },
      fontFamily: {
        mono: ['SF Mono', 'Menlo', 'monospace']
      }
    }
  },
  plugins: []
};

import { paraglide } from '@inlang/paraglide-sveltekit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    enhancedImages(),
    sveltekit(),
    paraglide({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
    }),
  ],

  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },

  resolve: {
    alias: {
      '@': '/src',
    },
  },

  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
});

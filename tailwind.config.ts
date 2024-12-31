import aspectRatio from '@tailwindcss/aspect-ratio';
import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import flowbitePlugin from 'flowbite/plugin';
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{html,js,svelte,ts,scss}',
    './node_modules/svelte-5-ui-lib/**/*.{html,js,svelte,ts}',
    './node_modules/flowbite-svelte-icons/**/*.{html,js,svelte,ts}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#CABFFF',
          200: '#B5A8F7',
          300: '#A08FE0',
          400: '#8A75C9',
          500: '#755CB2',
          600: '#60429B',
          700: '#4B2884',
          800: '#351F66',
          900: '#241548',
        },
      },
      screens: {
        xs: '480px',
      },
      inset: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  corePlugins: {
    aspectRatio: false,
  },
  plugins: [flowbitePlugin, typography, forms, containerQueries, aspectRatio],
} satisfies Config;

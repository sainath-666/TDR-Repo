import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        telugu: ['var(--font-telugu)', 'Noto Sans Telugu', 'system-ui', 'sans-serif'],
      },
      colors: {
        apcrda: {
          primary: '#1b3a6b',
          'primary-light': '#2e5c9a',
          'primary-dark': '#0f2347',
          secondary: '#d4a012',
          'secondary-light': '#f5c842',
          accent: '#0d9488',
          'accent-light': '#14b8a6',
        },
        'apcrda-gov': {
          nav: '#0284c7',
          'nav-dark': '#0369a1',
          light: '#e0f2fe',
          accent: '#ea580c',
        },
        'apcrda-portal': {
          purple: '#8b2e8b',
          'purple-dark': '#5c1a6e',
          'purple-light': '#ab47ab',
          maroon: '#8b1e3f',
          red: '#dc2626',
          blue: '#0284c7',
          light: '#f8f0fa',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(30 27 75 / 0.05), 0 1px 2px -1px rgb(30 27 75 / 0.05)',
        'card-hover': '0 12px 28px -8px rgb(88 28 135 / 0.14), 0 4px 8px -4px rgb(30 27 75 / 0.08)',
        sidebar: '4px 0 28px -4px rgb(15 35 71 / 0.35)',
        header: '0 1px 4px 0 rgb(30 27 75 / 0.08)',
        glow: '0 0 20px -4px rgb(139 46 139 / 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.45s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

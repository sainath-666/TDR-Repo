import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        apcrda: {
          primary: '#1e3a5f',
          'primary-light': '#2d5a8e',
          'primary-dark': '#0f2744',
          secondary: '#c9a227',
          'secondary-light': '#e8c547',
          accent: '#2d6a4f',
          'accent-light': '#40916c',
        },
        'apcrda-gov': {
          nav: '#1a6b8a',
          'nav-dark': '#145a70',
          light: '#e8f4f8',
          accent: '#d35400',
        },
        'apcrda-portal': {
          purple: '#7D007D',
          'purple-dark': '#662D91',
          maroon: '#7a1f3d',
          red: '#c0392b',
          blue: '#1a6fb5',
          light: '#f5f0f8',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
        sidebar: '4px 0 24px -4px rgb(0 0 0 / 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
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

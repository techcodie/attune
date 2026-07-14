import type { Config } from 'tailwindcss';

/**
 * Attune design tokens. Dark-first. A restrained palette — one accent
 * (violet→cyan) against deep slate — so the UI reads premium, not busy.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070812',
          900: '#0b0d1a',
          800: '#121527',
          700: '#1b1f38',
        },
        accent: {
          DEFAULT: '#7c6cff',
          400: '#8f83ff',
          500: '#7c6cff',
          600: '#6a56f0',
        },
        cyanic: '#37e6d0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.45)',
        glow: '0 0 40px rgba(124, 108, 255, 0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;

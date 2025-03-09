/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#a78bfa',
          dark: '#8b5cf6',
          light: '#c4b5fd'
        },
        secondary: {
          DEFAULT: '#cbd5e1',
          dark: '#94a3b8',
          light: '#e2e8f0'
        },
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#475569'
        },
        light: {
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0'
        },
        glass: {
          bg: 'rgba(31, 41, 65, 0.7)',
          border: 'rgba(76, 85, 101, 0.6)'
        },
        'input-bg': 'var(--input-bg)',
        'input-text': 'var(--input-text)',
        'input-border': 'var(--input-border)',
        'addon-bg': 'var(--input-addon-bg)',
        'addon-text': 'var(--input-addon-text)',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(8px)'
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif']
      },
      backgroundColor: {
        'input-dark': '#1e293b',
      },
      textColor: {
        'input-light': '#f1f5f9',
      },
      borderColor: {
        'input-border': '#475569',
      },
    }
  },
  plugins: []
} 
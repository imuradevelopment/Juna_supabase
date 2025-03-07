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
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
          light: '#818cf8'
        },
        secondary: {
          DEFAULT: '#64748b',
          dark: '#475569',
          light: '#94a3b8'
        },
        dark: {
          bg: '#111827',
          card: '#1f2937',
          border: '#374151'
        },
        light: {
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0'
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.2)'
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
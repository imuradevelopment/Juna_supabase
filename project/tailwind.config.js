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
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          dark: 'rgb(var(--primary--color-primary-dark-dark) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)'
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          dark: 'rgb(var(--color-text-muted) / <alpha-value>)',
          light: 'rgb(var(--color-secondary-light) / <alpha-value>)'
        },
        dark: {
          bg: 'rgb(var(--dark-bg) / <alpha-value>)',
          card: 'rgb(var(--color-surface) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)'
        },
        glass: {
          bg: 'rgb(var(--color-surface-variant) / <alpha-value>)',
          border: 'rgb(var(--color-border-light) / <alpha-value>)'
        },
        input: {
          bg: 'rgb(var(--color-surface) / <alpha-value>)',
          text: 'rgb(var(--color-text) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          'focus-border': 'rgb(var(--color-primary) / <alpha-value>)',
          placeholder: 'rgb(var(--color-text-muted) / <alpha-value>)',
          addon: {
            bg: 'rgb(var(--color-surface-accent) / <alpha-value>)',
            text: 'rgb(var(--color-text) / <alpha-value>)'
          }
        },
        error: {
          bg: 'rgb(var(--color-error-dark) / <alpha-value>)',
          border: 'rgb(var(--color-error-dark) / <alpha-value>)',
          text: 'rgb(var(--color-error) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-error) / <alpha-value>)'
        },
        success: {
          bg: 'rgb(var(--color-success-dark) / <alpha-value>)',
          border: 'rgb(var(--color-success-dark) / <alpha-value>)',
          text: 'rgb(var(--color-success-dark) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)'
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)'
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)'
        },
        text: {
          hint: 'rgb(var(--color-text-muted) / <alpha-value>)',
          required: 'rgb(var(--color-error) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-text) / <alpha-value>)',
          heading: 'rgb(var(--color-heading) / <alpha-value>)'
        },
        link: {
          primary: 'rgb(var(--color-primary) / <alpha-value>)',
          'primary-hover': 'rgb(var(--color-primary-dark) / <alpha-value>)'
        },
        btn: {
          'primary-bg': 'rgb(var(--color-primary) / <alpha-value>)',
          'primary-text': 'rgb(var(--color-text-white) / <alpha-value>)',
          'primary-hover': 'rgb(var(--color-primary-dark) / <alpha-value>)'
        },
        card: {
          bg: 'rgb(var(--color-surface) / <alpha-value>)',
          border: 'rgb(var(--color-border-light) / <alpha-value>)',
          shadow: 'rgb(var(--shadow-card) / <alpha-value>)'
        },
        accent1: 'rgb(var(--color-accent1) / <alpha-value>)',
        accent2: 'rgb(var(--color-accent2) / <alpha-value>)',
        accent3: 'rgb(var(--color-accent3) / <alpha-value>)',
        'input-dark': 'rgb(var(--color-surface) / <alpha-value>)',
        'input-light': 'rgb(var(--color-text) / <alpha-value>)',
        'input-border': 'rgb(var(--color-border) / <alpha-value>)',
        'addon-bg': 'rgb(var(--color-surface-accent) / <alpha-value>)',
        'addon-text': 'rgb(var(--color-text) / <alpha-value>)',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(8px)'
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif']
      },
      boxShadow: {
        'glass': 'var(--shadow-glass)',
        'card': '0 4px 6px rgb(var(--shadow-card) / <alpha-value>)',
        'glow': '0 0 15px rgb(var(--color-primary-dark) / 0.4)',
        'glow-hover': '0 0 25px rgb(var(--color-primary-dark) / 0.6)'
      }
    }
  },
  plugins: []
} 
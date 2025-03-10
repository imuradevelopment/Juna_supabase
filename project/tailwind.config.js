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
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          dark: 'rgb(var(--primary-dark) / <alpha-value>)',
          light: 'rgb(var(--primary-light) / <alpha-value>)'
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          dark: 'rgb(var(--secondary-dark) / <alpha-value>)',
          light: 'rgb(var(--secondary-light) / <alpha-value>)'
        },
        dark: {
          bg: 'rgb(var(--dark-bg) / <alpha-value>)',
          card: 'rgb(var(--dark-card) / <alpha-value>)',
          border: 'rgb(var(--dark-border) / <alpha-value>)'
        },
        glass: {
          bg: 'rgb(var(--glass-bg) / <alpha-value>)',
          border: 'rgb(var(--glass-border) / <alpha-value>)'
        },
        input: {
          bg: 'rgb(var(--input-bg) / <alpha-value>)',
          text: 'rgb(var(--input-text) / <alpha-value>)',
          border: 'rgb(var(--input-border) / <alpha-value>)',
          'focus-border': 'rgb(var(--input-focus-border) / <alpha-value>)',
          placeholder: 'rgb(var(--input-placeholder) / <alpha-value>)',
          addon: {
            bg: 'rgb(var(--input-addon-bg) / <alpha-value>)',
            text: 'rgb(var(--input-addon-text) / <alpha-value>)'
          }
        },
        error: {
          bg: 'rgb(var(--error-bg) / <alpha-value>)',
          border: 'rgb(var(--error-border) / <alpha-value>)',
          text: 'rgb(var(--error-text) / <alpha-value>)',
          DEFAULT: 'rgb(var(--error-color) / <alpha-value>)'
        },
        success: {
          bg: 'rgb(var(--success-bg) / <alpha-value>)',
          border: 'rgb(var(--success-border) / <alpha-value>)',
          text: 'rgb(var(--success-text) / <alpha-value>)',
          DEFAULT: 'rgb(var(--success-color) / <alpha-value>)'
        },
        warning: {
          DEFAULT: 'rgb(var(--warning-color) / <alpha-value>)'
        },
        info: {
          DEFAULT: 'rgb(var(--info-color) / <alpha-value>)'
        },
        text: {
          hint: 'rgb(var(--text-hint) / <alpha-value>)',
          required: 'rgb(var(--text-required) / <alpha-value>)',
          DEFAULT: 'rgb(var(--text-color) / <alpha-value>)',
          heading: 'rgb(var(--heading-color) / <alpha-value>)'
        },
        link: {
          primary: 'rgb(var(--link-primary) / <alpha-value>)',
          'primary-hover': 'rgb(var(--link-primary-hover) / <alpha-value>)'
        },
        btn: {
          'primary-bg': 'rgb(var(--btn-primary-bg) / <alpha-value>)',
          'primary-text': 'rgb(var(--btn-primary-text) / <alpha-value>)',
          'primary-hover': 'rgb(var(--btn-primary-hover) / <alpha-value>)'
        },
        card: {
          bg: 'rgb(var(--card-bg) / <alpha-value>)',
          border: 'rgb(var(--card-border) / <alpha-value>)',
          shadow: 'rgb(var(--card-shadow) / <alpha-value>)'
        },
        accent1: 'rgb(var(--accent1) / <alpha-value>)',
        accent2: 'rgb(var(--accent2) / <alpha-value>)',
        accent3: 'rgb(var(--accent3) / <alpha-value>)',
        'input-dark': 'rgb(var(--input-bg) / <alpha-value>)',
        'input-light': 'rgb(var(--input-text) / <alpha-value>)',
        'input-border': 'rgb(var(--input-border) / <alpha-value>)',
        'addon-bg': 'rgb(var(--input-addon-bg) / <alpha-value>)',
        'addon-text': 'rgb(var(--input-addon-text) / <alpha-value>)',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(8px)'
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif']
      },
      boxShadow: {
        'glass': 'var(--glass-shadow)',
        'card': '0 4px 6px rgb(var(--card-shadow) / <alpha-value>)',
        'glow': '0 0 15px rgb(var(--primary-dark) / 0.4)',
        'glow-hover': '0 0 25px rgb(var(--primary-dark) / 0.6)'
      }
    }
  },
  plugins: []
} 
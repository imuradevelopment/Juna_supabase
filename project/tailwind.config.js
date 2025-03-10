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
          DEFAULT: 'rgba(167, 139, 250, 1)',
          dark: 'rgba(139, 92, 246, 1)',
          light: 'rgba(196, 181, 253, 1)'
        },
        secondary: {
          DEFAULT: 'rgba(203, 213, 225, 1)',
          dark: 'rgba(148, 163, 184, 1)',
          light: 'rgba(226, 232, 240, 1)'
        },
        dark: {
          bg: 'rgba(15, 23, 42, 1)',
          card: 'rgba(30, 41, 59, 1)',
          border: 'rgba(71, 85, 105, 1)'
        },
        light: {
          bg: 'rgba(248, 250, 252, 1)',
          card: 'rgba(255, 255, 255, 1)',
          border: 'rgba(226, 232, 240, 1)'
        },
        glass: {
          bg: 'rgba(31, 41, 65, 0.7)',
          border: 'rgba(76, 85, 101, 0.6)'
        },
        input: {
          bg: 'var(--input-bg)',
          text: 'var(--input-text)',
          border: 'var(--input-border)',
          'focus-border': 'var(--input-focus-border)',
          placeholder: 'var(--input-placeholder)',
          addon: {
            bg: 'var(--input-addon-bg)',
            text: 'var(--input-addon-text)'
          }
        },
        error: {
          bg: 'var(--error-bg)',
          border: 'var(--error-border)',
          text: 'var(--error-text)',
          DEFAULT: 'var(--error-color)'
        },
        success: {
          bg: 'var(--success-bg)',
          border: 'var(--success-border)',
          text: 'var(--success-text)',
          DEFAULT: 'var(--success-color)'
        },
        warning: {
          DEFAULT: 'var(--warning-color)'
        },
        info: {
          DEFAULT: 'var(--info-color)'
        },
        text: {
          hint: 'var(--text-hint)',
          required: 'var(--text-required)',
          DEFAULT: 'var(--text-color)',
          heading: 'var(--heading-color)'
        },
        link: {
          primary: 'var(--link-primary)',
          'primary-hover': 'var(--link-primary-hover)'
        },
        btn: {
          'primary-bg': 'var(--btn-primary-bg)',
          'primary-text': 'var(--btn-primary-text)',
          'primary-hover': 'var(--btn-primary-hover)'
        },
        card: {
          bg: 'var(--card-bg)',
          border: 'var(--card-border)',
          shadow: 'var(--card-shadow)'
        },
        accent1: 'var(--accent1)',
        accent2: 'var(--accent2)',
        accent3: 'var(--accent3)',
        'input-bg': 'var(--input-bg)',
        'input-text': 'var(--input-text)',
        'input-border': 'var(--input-border)',
        'addon-bg': 'var(--input-addon-bg)',
        'addon-text': 'var(--input-addon-text)',
        'input-dark': 'rgba(30, 41, 59, 1)',
        'input-light': 'rgba(241, 245, 249, 1)',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(8px)'
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif']
      },
      backgroundColor: {
        'input-dark': 'rgba(30, 41, 59, 1)',
      },
      textColor: {
        'input-light': 'rgba(241, 245, 249, 1)',
      },
      borderColor: {
        'input-border': 'rgba(71, 85, 105, 1)',
      },
      boxShadow: {
        'glass': 'var(--glass-shadow)',
        'card': '0 4px 6px var(--card-shadow)',
        'glow': '0 0 15px rgba(139, 92, 246, 0.4)',
        'glow-hover': '0 0 25px rgba(139, 92, 246, 0.6)'
      }
    }
  },
  plugins: []
} 
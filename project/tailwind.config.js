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
          dark: 'rgb(var(--color-primary-dark) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)'
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)'
        },
        error: {
          DEFAULT: 'rgb(var(--color-error) / <alpha-value>)'
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif']
      },
    }
  },
  plugins: []
} 
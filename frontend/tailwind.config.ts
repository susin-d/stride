/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-bg-app) / <alpha-value>)',
        surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
        card: 'rgb(var(--color-bg-card) / <alpha-value>)',
        input: 'rgb(var(--color-bg-input) / <alpha-value>)',
        'dark-surface': '#171717',
        'dark-card': '#1C1C1E',
        primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        accent: 'rgb(var(--color-accent-primary) / <alpha-value>)',
        'accent-fg': 'rgb(var(--color-accent-fg) / <alpha-value>)',
        border: 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        'border-light': 'rgba(255, 255, 255, 0.8)',
      },
      boxShadow: {
        'neu-raised': '0 4px 14px rgba(0, 0, 0, 0.06)',
        'neu-raised-sm': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'neu-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        'neu-pressed': 'inset 0 2px 4px rgba(0, 0, 0, 0.08)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
        'dark-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}

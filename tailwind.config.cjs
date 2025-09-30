/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Custom theme colors
        primary: {
          light: '#3b82f6',
          dark: '#60a5fa',
        },
        background: {
          light: '#ffffff',
          dark: '#1a1a1a',
        },
        surface: {
          light: '#f9fafb',
          dark: '#262626',
        },
        text: {
          primary: {
            light: '#0f1419',
            dark: '#e7e9ea',
          },
          secondary: {
            light: '#536471',
            dark: '#8b98a5',
          },
        },
        border: {
          light: '#eff3f4',
          dark: '#2f3336',
        },
      },
      backgroundColor: {
        'theme-bg': 'var(--bg-primary)',
        'theme-surface': 'var(--bg-surface)',
      },
      textColor: {
        'theme-primary': 'var(--text-primary)',
        'theme-secondary': 'var(--text-secondary)',
      },
      borderColor: {
        'theme': 'var(--border-color)',
      },
    },
  },
  plugins: [],
}

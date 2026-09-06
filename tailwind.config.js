/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#020617',
        },
        civic: {
          blue: '#3B82F6',
          'blue-dark': '#1D4ED8',
          'blue-light': '#60A5FA',
        },
        priority: {
          high: '#EF4444',
          'high-bg': '#7F1D1D',
          medium: '#F59E0B',
          'medium-bg': '#78350F',
          low: '#22C55E',
          'low-bg': '#14532D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

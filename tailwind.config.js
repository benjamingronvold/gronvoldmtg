/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        mtg: {
          bg: '#0f0f1a',
          card: '#1a1a2e',
          border: '#2d2d44',
          gold: '#c89b3c',
          text: '#e8e8f0',
          muted: '#8888a8',
          success: '#3cb371',
          danger: '#c0392b',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

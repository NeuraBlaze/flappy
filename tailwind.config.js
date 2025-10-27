/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'pixel': ['monospace'],
      },
      colors: {
        'pixel-bg': '#87CEEB',
        'pixel-ground': '#DEB887',
        'pixel-pipe': '#228B22',
        'pixel-bird': '#FFD700',
        'pixel-dark': '#2F4F4F',
      },
      animation: {
        'float': 'float 2s ease-in-out infinite',
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
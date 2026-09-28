/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#030712',
          900: '#070D1F',
          800: '#0C1635',
          700: '#13214C',
        },
        nasa: {
          cyan: '#38BDF8',
          blue: '#0284C7',
          red: '#EF4444',
          amber: '#F59E0B',
          emerald: '#10B981',
        }
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

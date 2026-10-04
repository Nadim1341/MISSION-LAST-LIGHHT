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
          950: '#080B12',
          900: '#0D111A',
          850: '#111722',
          800: '#151B26',
          750: '#1B2330',
          700: '#232D3E',
          600: '#293342',
        },
        panel: {
          bg: '#151B26',
          surface: '#1B2330',
          border: '#293342',
        },
        txt: {
          primary: '#F3F6FA',
          secondary: '#AAB4C3',
          muted: '#6F7B8C',
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
        heading: ['IBM Plex Sans', 'Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
        sans: ['Inter', 'IBM Plex Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

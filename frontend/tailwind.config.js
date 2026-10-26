/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        madstory: {
          burgundy: '#800020',
          'burgundy-dark': '#660019',
          'burgundy-light': '#9b1b30',
          tan: '#f4eee6',
          'tan-light': '#faf6f0',
          'tan-dark': '#ded7cc',
          border: '#e2ddd3',
          'border-hover': '#d4ccbd',
          dark: '#1e2022',
          muted: '#64748b',
          gold: '#c59b27',
        }
      },
      fontFamily: {
        bengali: ['"Hind Siliguri"', '"Noto Sans Bengali"', 'sans-serif'],
        serif: ['Lora', 'Merriweather', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'madstory': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'madstory-hover': '0 6px 16px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}

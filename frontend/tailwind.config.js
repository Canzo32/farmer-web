/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          100: '#F5F0E6',
          200: '#E6D8C3',
          300: '#D6C0A0',
          400: '#C7A87D',
          500: '#B7905A',
          600: '#9A7848',
          700: '#7D6036',
          800: '#604824',
          900: '#433012',
        },
      },
    },
  },
  plugins: [],
};
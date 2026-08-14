/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2196f3',
          50: '#DCEFFD',
          100: '#CFE8FC',
          200: '#a4d4fa',
          300: '#78bff8',
          400: '#4fabf5',
          500: '#2196f3',
          600: '#0c7fda',
          700: '#0966af',
          800: '#074c83',
          900: '#053358',
        },
        accent: '#663bab',
      },
      fontFamily: {
        sans: ['Roboto', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

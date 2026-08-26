/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        countable: {
          sidebar: '#07111F',
          surface: '#0A1930',
          blue: '#388AF3',
          cyan: '#31B8FC',
          violet: '#7540F9',
          'blue-violet': '#4B5BF8',
          bg: '#F5F7FB',
          card: '#FFFFFF',
          input: '#EEF5FC',
          border: '#DCE5F0',
          text: '#101828',
          muted: '#667085',
        },
        // alias temporal de compatibilidad
        solia: {
          sidebar: '#07111F',
          surface: '#0A1930',
          blue: '#388AF3',
          cyan: '#31B8FC',
          violet: '#7540F9',
          'blue-violet': '#4B5BF8',
          bg: '#F5F7FB',
          card: '#FFFFFF',
          input: '#EEF5FC',
          border: '#DCE5F0',
          text: '#101828',
          muted: '#667085',
        },
        primary: {
          DEFAULT: '#388AF3',
          50: '#EAF3FE',
          100: '#D5E7FD',
          200: '#ABCEFB',
          300: '#82B6F8',
          400: '#589DF6',
          500: '#388AF3',
          600: '#1F71DB',
          700: '#1859AD',
          800: '#11417E',
          900: '#0B2950',
        },
        accent: {
          DEFAULT: '#7540F9',
          50: '#F1EBFE',
          100: '#E3D7FD',
          200: '#C7AFFE',
          300: '#AB87FC',
          400: '#8F5FFA',
          500: '#7540F9',
          600: '#5B22E6',
          700: '#471AB4',
          800: '#341382',
          900: '#210C50',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(16, 24, 40, 0.05)',
      },
    },
  },
  plugins: [],
};

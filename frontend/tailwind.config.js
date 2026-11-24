/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif']
      },
      colors: {
        ivory: {
          50: '#FCFBF8',
          100: '#F6F3EC',
          200: '#EAE4D7'
        },
        emerald: {
          600: '#1E6B52',
          700: '#16523F'
        },
        amber: {
          500: '#D97706',
          600: '#B45309'
        }
      }
    }
  },
  plugins: []
};

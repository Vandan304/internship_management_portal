/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d0d9e4',
          300: '#a6bcd0',
          400: '#7698b9',
          500: '#527b9f',
          600: '#3e6282',
          700: '#334f69',
          800: '#2d4358',
          900: '#283949',
          950: '#1a2530',
        },
        slate: {
            850: '#1f2937', // Custom dark
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
        'glow': '0 0 15px rgba(59, 130, 246, 0.1)',
      }
    },
  },
  plugins: [],
}

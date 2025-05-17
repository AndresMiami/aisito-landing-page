/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        'color-teal': '#00A09A',
        'color-teal-dark': '#008080',
        'color-gold': '#B08D57',
        'color-gold-dark': '#A07844',
        'color-palm-green': '#3CB371',
        'dark-brown': 'rgb(28 22 4 / 90%)', // Custom background color
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
      },
      padding: {
        '0.2': '0.05rem',
      },
      maxWidth: {
        'custom': '50rem', // 800px
        'narrow-sm': '25rem', // 400px (optional)
        'narrow-xl': '37.5rem', // 600px (optional)
      },
      height: {
        'custom': '37.5rem', // 600px
      },
    },
  },
  plugins: [],
}
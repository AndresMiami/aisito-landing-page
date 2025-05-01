/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",  // Scan HTML files in the root
    "./src/**/*.{js,ts,jsx,tsx,html}", // Scan relevant files in src folder and subfolders
    // Add any other paths where you use Tailwind classes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}


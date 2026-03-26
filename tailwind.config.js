/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media'
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        light: {
          bg: '#e5e7eb',      // gray-200 (was gray-100)
          card: '#f3f4f6',    // gray-100 (was gray-50)
          border: '#d1d5db',  // gray-300 (was gray-200)
          text: '#1f2937',    // gray-800 (was gray-700)
          subtext: '#4b5563'  // gray-600 (was gray-500)
        }
      }
    }
  },
  plugins: []
};


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4361ee',
        secondary: '#3f37c9',
        success: '#4caf50',
        error: '#f44336',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        school: {
          navy: '#0D285F',
          navydark: '#07193B',
          navylight: '#1E3A8A',
          navycontainer: '#E0E7FF',
          gold: '#D4AF37',
          golddark: '#B8860B',
          goldlight: '#FDE68A',
          goldcontainer: '#FEF3C7',
          whatsapp: '#25D366',
          whatsappdark: '#128C7E',
        }
      }
    },
  },
  plugins: [],
}

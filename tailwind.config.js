/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0f1a',
        surface: '#121826',
        neon: '#7c5cff',
        aqua: '#22d3ee',
        acid: '#a3ff12'
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
      boxShadow: { glow: '0 0 50px -10px rgba(124,92,255,.65)' },
      borderRadius: { '4xl': '2rem' }
    }
  },
  plugins: []
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sector: {
          slow: '#F97316',    // Oranye untuk lambat (< threshold low)
          normal: '#22C55E',  // Hijau untuk normal (sedang)
          fast: '#EF4444',    // Merah untuk cepat (ngebut)
        },
        moto: {
          dark: '#0F172A',
          card: '#1E293B',
          accent: '#38BDF8',
          neon: '#06B6D4'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}

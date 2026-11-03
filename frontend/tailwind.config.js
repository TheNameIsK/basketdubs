export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vintage Basketball Color Palette
        'vintage-cream': '#F3E9D2',
        'burnt-orange': '#D97736',
        'forest-green': '#244B3B',
        'vintage-navy': '#24344A',
        'ink-black': '#292722',
        'paper-brown': '#8B7355',
        'scoreboard-red': '#C8102E',
        'court-wood': '#8B4513',
      },
      fontFamily: {
        'bebas': ['Bebas Neue', 'sans-serif'],
        'roboto-slab': ['Roboto Slab', 'serif'],
        'dm-sans': ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px rgba(41, 39, 34, 1)',
        'hard-sm': '2px 2px 0px 0px rgba(41, 39, 34, 1)',
        'hard-lg': '6px 6px 0px 0px rgba(41, 39, 34, 1)',
        'vintage': '4px 4px 0px 0px #292722, inset 0px 0px 0px 1px rgba(139, 115, 85, 0.1)',
      },
      backgroundImage: {
        'paper-texture': "url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100\" height=\"100\" filter=\"url(%23noise)\" opacity=\"0.05\"/%3E%3C/svg%3E')",
        'halftone': "radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.1) 1px, transparent 0)",
        'court-wood': "linear-gradient(90deg, #8B4513 0%, #A0522D 50%, #8B4513 100%)",
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'scoreboard-flash': 'flash 1s ease-in-out infinite',
        'pulse-hard': 'pulse-hard 2s ease-in-out infinite',
      },
      keyframes: {
        flash: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'pulse-hard': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        }
      }
    },
  },
  plugins: [],
}
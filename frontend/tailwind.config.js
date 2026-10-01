/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05070c',
          900: '#0a0e17',
          850: '#0e1420',
          800: '#131b2b',
          700: '#1b2740',
          600: '#26365a',
        },
        mint: {
          400: '#3fe0a5',
          500: '#1fcf8f',
          600: '#12a874',
        },
        coral: {
          400: '#ff7a6b',
          500: '#f2564a',
          600: '#d43f37',
        },
        gold: {
          300: '#f2d38a',
          400: '#e6bd5c',
          500: '#cf9f3a',
        },
        paper: '#eef1f6',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(63, 224, 165, 0.35)',
        card: '0 20px 50px -20px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'grid-lines':
          'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

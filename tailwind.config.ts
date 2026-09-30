import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Taken from the Kimkloset logo gradient
        brand: {
          50: '#FFF5FD',
          100: '#FDE7F9',
          200: '#FBD7F5',
          300: '#FAB5ED',
          400: '#F995E6',
          500: '#F86EDE',
          600: '#E04BC4',
          700: '#B8339F',
          800: '#8C2679',
          900: '#5E1A52',
        },
        ink: '#111111',
        surface: '#F5F5F4',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #F86EDE 0%, #FAB5ED 45%, #FDFCFD 100%)',
      },
    },
  },
  plugins: [],
};

export default config;

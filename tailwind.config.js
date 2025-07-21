/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#111927',
          card: '#1f2937',
          hover: '#374151',
          border: '#4b5563',
        },
        accent: {
          blue: '#2563EB',
          'blue-hover': '#1d4ed8',
        }
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #111927 0%, #1f2937 100%)',
      }
    },
  },
  plugins: [],
};

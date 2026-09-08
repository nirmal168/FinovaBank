/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          main: 'var(--finova-bg-main)',
          sec: 'var(--finova-bg-secondary)',
          card: 'var(--finova-card-bg)',
          elevated: 'var(--finova-card-elevated)',
          text: 'var(--finova-text-main)',
          'text-sec': 'var(--finova-text-secondary)',
          'text-muted': 'var(--finova-text-muted)',
          border: 'var(--finova-border)',
          primary: 'var(--finova-primary)',
          sage: 'var(--finova-sage)',
          mint: 'var(--finova-mint)',
          warm: 'var(--finova-warm-accent)',
        },
        finova: {
          navy: '#17324D',
          deep: '#102A43',
          blue: '#4F7CAC',
          sage: '#5B8C72',
          mint: '#DDEDE4',
          cream: '#F7F5EF',
          white: '#FCFBF8',
          charcoal: '#263238',
          gray: '#667085',
          lightgray: '#E8E6E1',
          border: '#E2E0DA',
          success: '#3F7D58',
          warning: '#C58A3A',
          danger: '#B85C5C',
          info: '#4F7CAC',
        },
        brand: {
          50: '#F7F5EF',     // Warm cream
          100: '#DDEDE4',    // Soft mint
          200: '#E8E6E1',    // Light gray
          300: '#E2E0DA',    // Subtle border
          400: '#4F7CAC',    // Soft blue
          500: '#5B8C72',    // Sage green
          600: '#17324D',    // Primary navy
          700: '#102A43',    // Deep navy
          800: '#0F1F2E',    // Darker navy
          900: '#091522',    // Midnight navy
          950: '#050D15',
        },
      },
      boxShadow: {
        'finova': '0 2px 8px rgba(23, 50, 77, 0.06)',
        'finova-md': '0 4px 12px rgba(23, 50, 77, 0.08)',
        'finova-lg': '0 8px 24px rgba(23, 50, 77, 0.10)',
      },
      borderRadius: {
        'finova-sm': '10px',
        'finova': '14px',
        'finova-lg': '16px',
        'finova-xl': '20px',
      },
    },
  },
  plugins: [],
}

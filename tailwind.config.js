/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#fafaf8',
        foreground: '#1a1916',
        primary: '#1f4e79',
        'primary-foreground': '#ffffff',
        secondary: '#f4f3ef',
        'secondary-foreground': '#1a1916',
        destructive: '#c0392b',
        border: '#ddd9cf',
        ring: '#2e75b6',
      },
      borderRadius: {
        lg: '0.625rem',
      },
    },
  },
  plugins: [],
}
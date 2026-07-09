/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          lime: '#c8f24c',
          'lime-light': '#e4ffa8',
          ink: '#12261c',
          body: '#4f5f54',
          'body-strong': '#2b3d33',
          muted: '#8a9a8e',
          hairline: '#e3eae0',
          'hairline-strong': '#cddcc9',
          canvas: '#ffffff',
          'surface-soft': '#eef8df',
          'surface-elevated': '#dff2c4',
          'dark-green': '#1b3b2c',
          'dark-green-deep': '#12281e',
          cream: '#faf8f0',
          'badge-orange': '#f4a13a',
          'badge-pink': '#f4b8c8',
          'badge-blue': '#a7c7e7',
          warning: '#f4a13a',
          success: '#3fa34d',
        },
      },
      borderRadius: {
        'brand-xs': '8px',
        'brand-sm': '12px',
        'brand-md': '20px',
        'brand-lg': '32px',
      },
      spacing: {
        'brand-xxs': '4px',
        'brand-xs': '8px',
        'brand-sm': '12px',
        'brand-md': '16px',
        'brand-lg': '24px',
        'brand-xl': '40px',
        'brand-xxl': '64px',
        'brand-section': '96px',
      },
    },
  },
  plugins: [],
};

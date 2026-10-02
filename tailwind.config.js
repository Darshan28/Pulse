/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pulse: {
          purple: 'var(--pulse-purple)',
          magenta: 'var(--pulse-magenta)',
          deep: 'var(--pulse-deep)',
          soft: 'var(--pulse-soft)',
          ink: 'var(--pulse-ink)',
          muted: 'var(--pulse-muted)',
          border: 'var(--pulse-border)',
          surface: 'var(--pulse-surface)',
          bg: 'var(--pulse-bg)',
          success: 'var(--pulse-success)',
          warning: 'var(--pulse-warning)',
          danger: 'var(--pulse-danger)',
          info: 'var(--pulse-info)',
        },
      },
      fontFamily: {
        sans: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 40px rgba(15, 39, 42, 0.07)',
        glow: '0 12px 28px rgba(20, 184, 166, 0.22)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bar-grow': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'wash': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s ease-out both',
        'bar-grow': 'bar-grow 1.1s cubic-bezier(0.22, 1, 0.36, 1) both',
        wash: 'wash 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

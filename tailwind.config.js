/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./preview.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  darkMode: ['class', '[class~="theme-axiom-dark"]'],
  theme: {
    extend: {
      colors: {
        axiom: {
          dark: '#0e1117',
          surface: '#161b22',
          border: '#30363d',
          accent: '#3b82f6',
          purple: '#8b5cf6',
          text: '#f0f6fc',
          muted: '#8b949e',
        },
        light: {
          bg: '#f8fafc',
          surface: '#ffffff',
          border: '#e2e8f0',
          text: '#0f172a',
          muted: '#64748b'
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"'
        ],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
};

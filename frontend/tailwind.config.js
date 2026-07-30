/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        surface: {
          DEFAULT: '#0f172a',
          light:   '#1e293b',
          lighter: '#334155',
        },
        // 保留少量功能色，但严格克制
        accent: {
          cyan:   '#22d3ee',
          green:  '#34d399',
          amber:  '#fbbf24',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
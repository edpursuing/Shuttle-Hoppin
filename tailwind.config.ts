import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        mta: {
          '7':    '#6E3A90',
          'e':    '#0039A6',
          'f':    '#FF6319',
          'm':    '#FF6319',
          'n':    '#FCCC0A',
          'w':    '#FCCC0A',
          'g':    '#6CBE45',
          'lirr': '#555555',
        },
        hoppin: {
          'card':   '#1A1A1A',
          'action': '#2E86C1',
          'urgent': '#EF9F27',
          'slack':  '#4A154B',
          'avatar': '#333333',
        },
      },
    },
  },
  plugins: [],
} satisfies Config

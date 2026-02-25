import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        savings: {
          DEFAULT: '#1a7a4a',
          accent: '#a8f0c6',
        },
        spend: {
          DEFAULT: '#c97c1a',
          accent: '#ffd966',
        },
        giving: {
          DEFAULT: '#b52d5a',
          accent: '#ffb3c8',
        },
        navy: '#1e293b',
      },
      fontSize: {
        'kid-label': ['18px', { lineHeight: '1.4' }],
        'kid-balance': ['36px', { lineHeight: '1.2' }],
        'kid-jar': ['22px', { lineHeight: '1.3' }],
      },
    },
  },
  plugins: [],
}

export default config

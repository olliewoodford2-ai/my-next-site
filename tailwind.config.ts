import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0A0A0A',
          deep: '#050505',
          elevated: '#121212',
        },
        ivory: {
          DEFAULT: '#F5F0E8',
          warm: '#FDF8F0',
          muted: '#E8E0D4',
        },
        oxidized: {
          DEFAULT: '#7A7A8A',
          light: '#9A9AB8',
          dark: '#5A5A6A',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8D4A0',
          dark: '#A08838',
          shimmer: '#FFD700',
        },
        crimson: {
          DEFAULT: '#8B1A1A',
          light: '#B83A3A',
          dark: '#5A1010',
        },
      },
      fontFamily: {
        editorial: ['var(--font-editorial)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(4rem, 12vw, 14rem)', { lineHeight: '0.95', letterSpacing: '-0.03em', fontWeight: '300' }],
        'display-lg': ['clamp(3rem, 8vw, 8rem)', { lineHeight: '1.0', letterSpacing: '-0.02em', fontWeight: '300' }],
        'display-md': ['clamp(2rem, 5vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.015em', fontWeight: '300' }],
        'display-sm': ['clamp(1.5rem, 3vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '300' }],
        'headline': ['clamp(1.25rem, 2.5vw, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.005em', fontWeight: '400' }],
        'body-lg': ['clamp(1.125rem, 1.5vw, 1.25rem)', { lineHeight: '1.7', letterSpacing: '0' }],
        'body': ['clamp(1rem, 1.2vw, 1.125rem)', { lineHeight: '1.7', letterSpacing: '0' }],
        'body-sm': ['clamp(0.875rem, 1vw, 1rem)', { lineHeight: '1.6', letterSpacing: '0' }],
        'caption': ['clamp(0.75rem, 0.8vw, 0.875rem)', { lineHeight: '1.5', letterSpacing: '0.05em' }],
        'micro': ['clamp(0.625rem, 0.7vw, 0.75rem)', { lineHeight: '1.5', letterSpacing: '0.1em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '38': '9.5rem',
        '42': '10.5rem',
        '46': '11.5rem',
        '50': '12.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-out': 'fadeOut 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-up': 'slideUp 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-down': 'slideDown 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scale-in': 'scaleIn 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'reveal-text': 'revealText 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'orbit': 'orbit 60s linear infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'rotate-slow': 'rotateSlow 120s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(60px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-60px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        revealText: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%, 100%': { backgroundPosition: '-200% center' },
          '50%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '25%': { transform: 'translateY(-10px) translateX(5px)' },
          '50%': { transform: 'translateY(5px) translateX(-5px)' },
          '75%': { transform: 'translateY(-5px) translateX(10px)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(100px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(100px) rotate(-360deg)' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      },
      transitionTimingFunction: {
        'cinematic': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'cinematic-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'cinematic-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C9A84C 0%, #E8D4A0 50%, #FFD700 100%)',
        'obsidian-gradient': 'radial-gradient(ellipse at center, #121212 0%, #0A0A0A 50%, #050505 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
      backdropBlur: {
        'cinematic': '40px',
      },
      boxShadow: {
        'gold-glow': '0 0 60px -10px rgba(201, 168, 76, 0.4), 0 0 100px -20px rgba(201, 168, 76, 0.2)',
        'crimson-glow': '0 0 60px -10px rgba(139, 26, 26, 0.4), 0 0 100px -20px rgba(139, 26, 26, 0.2)',
        'obsidian-deep': 'inset 0 0 200px -50px rgba(0, 0, 0, 0.8)',
      },
      perspective: {
        'cinematic': '1000px',
        'immersive': '500px',
      },
      transformStyle: {
        'preserve-3d': 'preserve-3d',
      },
    },
  },
  plugins: [],
}

export default config
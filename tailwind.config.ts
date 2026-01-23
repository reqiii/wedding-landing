import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        peach: '#FFD4B3',
        'light-orange': '#FFB88C',
        'warm-sand': '#F5E6D3',
        'soft-rose': '#FFC4D6',
        'pale-sky-blue': '#B8E6E6',
        'minty-blue': '#A8D8E8',
        'off-white': '#FEFCFB',
        'light-gray': '#F5F3F0',
        'medium-gray': '#8B8B8B',
        'dark-gray': '#2C2C2C',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
      },
      spacing: {
        'xs': '0.5rem',
        'sm': '1rem',
        'md': '1.5rem',
        'lg': '2rem',
        'xl': '3rem',
        '2xl': '4rem',
        '3xl': '6rem',
      },
      borderRadius: {
        'small': '0.5rem',
        'medium': '1rem',
        'large': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-in-out',
        'gradient-shift': 'gradientShift 300s ease-in-out infinite',
        'texture-move': 'textureMove 60s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        textureMove: {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(10px, 10px)' },
        },
      },
      backdropBlur: {
        'glass-sm': '15px',
        'glass-md': '20px',
        'glass-lg': '25px',
        'glass-xl': '30px',
      },
    },
  },
  plugins: [],
}
export default config

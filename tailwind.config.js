/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: '#213c32',
        secondary: '#59645c',
        cream: '#f5f3eb',
        bg: '#f5f3eb',
        line: '#cfd1c4',
        accent: '#486238',
      },
      boxShadow: {
        'pill': '0 4px 20px rgba(0,0,0,0.05)',
        'pill-dark': '0 4px 20px rgba(255,255,255,0.05)',
        'rough': '3px 3px 0 0 rgba(26,26,26,0.08), 1px 1px 0 0 rgba(26,26,26,0.04)',
        'rough-lg': '5px 5px 0 0 rgba(26,26,26,0.1), 2px 2px 0 0 rgba(26,26,26,0.04), 8px 8px 0 0 rgba(26,26,26,0.03)',
      },
      borderRadius: {
        'blob': '60% 40% 65% 35% / 40% 55% 45% 60%',
        'blob-sm': '55% 45% 60% 40% / 45% 55% 40% 60%',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'liquid': 'liquid 3s ease infinite',
        'hourglass-flip': 'hourglassFlip 4s cubic-bezier(0.6, 0.05, 0.1, 1) infinite',
        'message-pop': 'messagePop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'message-pop-out': 'messagePopOut 0.3s ease-in forwards',
        'fade-out': 'fadeOut 0.3s ease-in forwards',
        'wiggle': 'wiggle 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 1s infinite',
        'doodle-appear': 'doodleAppear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'scribble-in': 'scribbleIn 1.2s ease-out forwards',
        'pop-rotate': 'popRotate 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        liquid: {
          '0%': { 'background-size': '200% 200%', 'background-position': '0% 50%' },
          '50%': { 'background-size': '200% 200%', 'background-position': '100% 50%' },
          '100%': { 'background-size': '200% 200%', 'background-position': '0% 50%' },
        },
        hourglassFlip: {
          '0%, 80%': { transform: 'rotate(0deg)' },
          '90%, 100%': { transform: 'rotate(180deg)' },
        },
        messagePop: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px) rotateX(-16deg) scale(0.92)',
            filter: 'blur(32px) brightness(0.1)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) rotateX(0deg) scale(1)',
            filter: 'blur(0px) brightness(1)'
          }
        },
        messagePopOut: {
          '0%': {
            opacity: '1',
            transform: 'translateY(0) rotateX(0deg) scale(1)',
            filter: 'blur(0px) brightness(1)'
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-10px) rotateX(-16deg) scale(0.92)',
            filter: 'blur(32px) brightness(0.1)'
          }
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-0.5deg)' },
          '25%': { transform: 'rotate(0.5deg)' },
          '50%': { transform: 'rotate(-0.3deg)' },
          '75%': { transform: 'rotate(0.3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(-1deg)' },
          '33%': { transform: 'translateY(-6px) rotate(0.5deg)' },
          '66%': { transform: 'translateY(3px) rotate(-0.5deg)' },
        },
        doodleAppear: {
          '0%': {
            opacity: '0',
            transform: 'scale(0) rotate(-30deg)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1) rotate(0deg)',
          },
        },
        scribbleIn: {
          '0%': {
            'stroke-dashoffset': '200',
            opacity: '0',
          },
          '100%': {
            'stroke-dashoffset': '0',
            opacity: '1',
          },
        },
        popRotate: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.3) rotate(-10deg)',
          },
          '60%': {
            transform: 'scale(1.1) rotate(2deg)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1) rotate(0deg)',
          },
        },
      }
    }
  },
  plugins: [],
}

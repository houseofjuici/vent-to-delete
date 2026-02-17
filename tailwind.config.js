/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./public/**/*.js",
    "./public/lib/**/*.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core Fusion System - Meridian Whisper Palette
        'void': '#050505',           // True Void - Primary Background
        'midnight': '#0A0A18',       // Midnight Ink - Secondary Surface / Input Area
        'panel': '#111111',          // Panel Surface - Vent Cards
        'elevated': '#1F1F35',       // Elevated Surface - Confirm Delete
        
        // Glows & Accents
        'magenta': {
          DEFAULT: '#FF00FF',        // Hot Magenta - DOMINANT GLOW
          glow: 'rgba(255, 0, 255, 0.3)',
          micro: 'rgba(255, 0, 255, 0.08)',
          intense: 'rgba(255, 0, 255, 0.2)',
        },
        'rose': {
          DEFAULT: '#FF2E88',        // Neon Rose - Supporting
        },
        'blood': {
          DEFAULT: '#FF003C',        // Blood Pixel - Destabilizer / Warnings / Timer
        },
        
        // Chrome
        'chrome': {
          liquid: '#E6E6E6',         // Liquid Chrome - Primary Text
          dirty: '#5B5B5B',          // Dirty Chrome - Labels / Secondary
        },
        
        // Semantic mappings
        'bg-primary': 'var(--color-bg-primary, #050505)',
        'bg-secondary': 'var(--color-bg-secondary, #0A0A18)',
        'bg-tertiary': 'var(--color-bg-tertiary, #111111)',
        'bg-elevated': 'var(--color-bg-elevated, #1F1F35)',
        'text-primary': 'var(--color-text-primary, #E6E6E6)',
        'text-secondary': 'var(--color-text-secondary, #5B5B5B)',
        'accent-primary': 'var(--color-accent-primary, #FF00FF)',
        'accent-secondary': 'var(--color-accent-secondary, #FF2E88)',
        'accent-danger': 'var(--color-accent-danger, #FF003C)',
      },
      
      boxShadow: {
        // Micro glow effects
        'glow-micro': '0 0 8px rgba(255, 0, 255, 0.15)',
        'glow-soft': '0 0 12px rgba(255, 0, 255, 0.2)',
        'glow-bloom': '0 0 20px rgba(255, 0, 255, 0.3)',
        'glow-intense': '0 0 30px rgba(255, 0, 255, 0.4)',
        
        // Blood glow for warnings/timer
        'glow-blood': '0 0 16px rgba(255, 0, 60, 0.4)',
        
        // Rose trail for delete animation
        'glow-rose': '0 0 12px rgba(255, 46, 136, 0.3)',
        
        // Surface depth
        'surface-panel': '0 1px 3px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        'surface-elevated': '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      
      animation: {
        // Pulse animations
        'pulse-magenta': 'pulseMagenta 1.2s ease-in-out infinite',
        'pulse-micro': 'pulseMicro 2s ease-in-out infinite',
        'pulse-blood': 'pulseBlood 1s ease-in-out infinite',
        
        // Motion behaviors
        'shrink-fade': 'shrinkFade 400ms ease-in forwards',
        'slide-up': 'slideUp 300ms ease-out forwards',
        'scale-in': 'scaleIn 200ms ease-out forwards',
        
        // Magenta spark
        'spark': 'spark 0.6s ease-out forwards',
      },
      
      keyframes: {
        pulseMagenta: {
          '0%, 100%': { 
            boxShadow: '0 0 8px rgba(255, 0, 255, 0.15)',
            transform: 'scale(1)',
          },
          '50%': { 
            boxShadow: '0 0 16px rgba(255, 0, 255, 0.25)',
            transform: 'scale(1.01)',
          },
        },
        pulseMicro: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        pulseBlood: {
          '0%, 100%': { 
            boxShadow: '0 0 8px rgba(255, 0, 60, 0.3)',
            opacity: '1',
          },
          '50%': { 
            boxShadow: '0 0 16px rgba(255, 0, 60, 0.5)',
            opacity: '0.9',
          },
        },
        shrinkFade: {
          '0%': { 
            opacity: '1', 
            transform: 'scale(1)',
          },
          '100%': { 
            opacity: '0', 
            transform: 'scale(0.9)',
          },
        },
        slideUp: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(10px)',
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)',
          },
        },
        scaleIn: {
          '0%': { 
            opacity: '0', 
            transform: 'scale(0.95)',
          },
          '100%': { 
            opacity: '1', 
            transform: 'scale(1)',
          },
        },
        spark: {
          '0%': { 
            boxShadow: '0 0 0 rgba(255, 0, 255, 0)',
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(255, 0, 255, 0.5)',
          },
          '100%': { 
            boxShadow: '0 0 0 rgba(255, 0, 255, 0)',
          },
        },
      },
      
      transitionDuration: {
        '400': '400ms',
      },
      
      backgroundImage: {
        'gradient-void': 'linear-gradient(135deg, #050505 0%, #1F1F35 100%)',
        'gradient-magenta': 'linear-gradient(135deg, #FF00FF 0%, #FF2E88 100%)',
        'gradient-magenta-subtle': 'linear-gradient(135deg, rgba(255, 0, 255, 0.1) 0%, rgba(255, 46, 136, 0.05) 100%)',
      },
      
      borderWidth: {
        '0.5': '0.5px',
        '1.5': '1.5px',
      },
    },
  },
  plugins: [],
}

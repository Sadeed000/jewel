/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          maroon: '#5a1a1a',
          'maroon-dark': '#3d0f0f',
          'maroon-light': '#7a2a2a',
          gold: '#d5aa72',
          'gold-light': '#e6c896',
          'gold-dark': '#b8924f',
          // Darker gold for small text on light surfaces — gold-dark is
          // decorative only (fails AA contrast at body sizes).
          'gold-ink': '#8a6a32',
          cream: '#fdfbf7',
          'cream-dark': '#f7f1e6',
          line: '#ece3d3',
          ink: '#1a1a1a',
          muted: '#6b6b6b',
        },
        // Admin console palette — light and on-brand: ivory canvas, white
        // cards, champagne gold and the storefront's maroon as the accent.
        admin: {
          canvas: '#f3ebdd',
          surface: '#ffffff',
          subtle: '#faf4e9',
          line: '#e4d5bb',
          'line-strong': '#d3bd97',
          ink: '#22140e',
          body: '#47362b',
          muted: '#7a6655',
          gold: '#bf9554',
          'gold-light': '#e4c690',
          'gold-ink': '#7a5622',
          'gold-soft': '#f5e7cc',
          blush: '#f5dfe1',
          rose: '#e9c3bd',
          maroon: '#7a2532',
          'maroon-deep': '#5a1a1a',
          'maroon-soft': '#f4dfe2',
          sidebar: '#efe2c9',
          'sidebar-deep': '#e5d0ab',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        admin: ['var(--font-admin)', 'var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // One radius scale for the whole store: controls → cards → panels.
        control: '0.625rem',
        card: '1rem',
        panel: '1.25rem',
      },
      boxShadow: {
        // Warm-tinted shadows read as "lit jewellery box" rather than grey UI.
        xs: '0 1px 2px rgba(61, 15, 15, 0.06)',
        soft: '0 2px 8px -2px rgba(61, 15, 15, 0.08), 0 1px 2px rgba(61, 15, 15, 0.04)',
        card: '0 12px 32px -12px rgba(61, 15, 15, 0.18), 0 2px 6px -2px rgba(61, 15, 15, 0.06)',
        lift: '0 24px 48px -16px rgba(61, 15, 15, 0.28), 0 4px 12px -4px rgba(61, 15, 15, 0.08)',
        'inner-line': 'inset 0 0 0 1px rgba(61, 15, 15, 0.08)',
        'admin-card': '0 1px 2px rgba(122, 82, 40, 0.05), 0 6px 20px -10px rgba(122, 82, 40, 0.14)',
        'admin-lift': '0 2px 6px rgba(122, 82, 40, 0.06), 0 20px 40px -16px rgba(122, 82, 40, 0.26)',
        'admin-gold': '0 8px 24px -10px rgba(201, 164, 106, 0.65)',
        'admin-maroon': '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 20px -10px rgba(122, 37, 50, 0.6)',
        'btn-primary': '0 1px 0 rgba(255,255,255,0.12) inset, 0 6px 16px -6px rgba(90, 26, 26, 0.55)',
        'btn-primary-hover': '0 1px 0 rgba(255,255,255,0.12) inset, 0 10px 24px -8px rgba(90, 26, 26, 0.6)',
      },
      transitionTimingFunction: {
        // Matches lib/motion.ts so CSS and framer-motion feel identical.
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'premium-in': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '220ms',
        slow: '300ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        marquee: 'marquee 30s linear infinite',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'spin-fast': 'spin 0.7s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};

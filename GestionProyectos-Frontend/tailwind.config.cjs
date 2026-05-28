/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const channel = (name) => `rgb(var(${name}) / <alpha-value>)`;
const scaled = (rem) => `calc(${rem} * var(--text-scale, 1))`;

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  // El ThemeContext escribe `data-theme="dark"` en <html>, así que ese es
  // el selector que activa los estilos `dark:`.
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: channel('--color-primary-50'),
          100: channel('--color-primary-100'),
          200: channel('--color-primary-200'),
          300: channel('--color-primary-300'),
          400: channel('--color-primary-400'),
          500: channel('--color-primary-500'),
          600: channel('--color-primary-600'),
          700: channel('--color-primary-700'),
          800: channel('--color-primary-800'),
          900: channel('--color-primary-900'),
          DEFAULT: channel('--color-primary-600')
        },
        'on-primary': channel('--color-on-primary'),
        'on-primary-soft': channel('--color-on-primary-soft'),
        bg: {
          DEFAULT: channel('--color-bg'),
          muted: channel('--color-bg-muted')
        },
        fg: {
          DEFAULT: channel('--color-fg'),
          muted: channel('--color-fg-muted'),
          subtle: channel('--color-fg-subtle'),
          faint: channel('--color-fg-faint')
        },
        surface: {
          hover: channel('--color-surface-hover')
        },
        border: {
          DEFAULT: channel('--color-border'),
          subtle: channel('--color-border-subtle')
        },
        sidebar: {
          bg: channel('--color-sidebar-bg'),
          hover: channel('--color-sidebar-hover'),
          active: channel('--color-sidebar-active')
        },
        page: channel('--color-page-bg')
      },
      fontSize: {
        // Sólo escala el font-size — alturas/paddings/gaps siguen en rem
        // fijos y los contenedores nunca se mueven.
        xs: [scaled('0.75rem'), { lineHeight: '1rem' }],
        sm: [scaled('0.875rem'), { lineHeight: '1.25rem' }],
        base: [scaled('1rem'), { lineHeight: '1.5rem' }],
        lg: [scaled('1.125rem'), { lineHeight: '1.75rem' }],
        xl: [scaled('1.25rem'), { lineHeight: '1.75rem' }],
        '2xl': [scaled('1.5rem'), { lineHeight: '2rem' }],
        '3xl': [scaled('1.875rem'), { lineHeight: '2.25rem' }]
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ]
      },
      width: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)'
      },
      spacing: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)'
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      transitionDuration: {
        350: '350ms'
      }
    }
  },
  plugins: [
    // Hace que los `text-[Xpx]` arbitrarios también respeten --text-scale.
    // Sin esto, todos los pixeles hardcoded en los componentes quedan fijos.
    plugin(function ({ matchUtilities }) {
      matchUtilities(
        {
          text: (value) => ({
            fontSize: `calc(${value} * var(--text-scale, 1))`
          })
        },
        { type: ['length', 'absolute-size', 'relative-size'] }
      );
    })
  ]
};

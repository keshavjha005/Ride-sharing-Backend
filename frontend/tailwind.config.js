/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FD7A00',
          dark: '#cc6300',
          light: '#ff9740',
        },
        background: {
          DEFAULT: '#1E1F25',
          secondary: '#2A2B32',
          tertiary: '#34353D',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#B0B3BD',
          muted: '#6C6F7F',
        },
        border: '#3E3F47',
        hover: '#2F3037',
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#F44336',
        info: '#00BCD4',
        task: {
          complete: '#4CAF50',
          inprogress: '#FD7A00',
          pending: '#FFC107',
        },
        calendar: {
          highlight: '#FD7A00',
        },
        tag: {
          android: '#8BC34A',
          ios: '#2196F3',
          uiux: '#9C27B0',
        },
        button: {
          primary: {
            bg: '#FD7A00',
            hover: '#ff9440',
            text: '#ffffff',
          },
          disabled: {
            bg: '#555',
            text: '#999',
          },
        },
        input: {
          bg: '#2A2B32',
          border: '#3E3F47',
          text: '#ffffff',
          placeholder: '#6C6F7F',
        },
        card: {
          bg: '#2A2B32',
          border: '#3E3F47',
          text: '#ffffff',
        },
        badge: {
          complete: '#4CAF50',
          medium: '#FFC107',
          high: '#F44336',
        },
      },
      fontFamily: {
        base: ['Inter', 'sans-serif'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
      },
      fontWeight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeight: {
        tight: 1.2,
        normal: 1.5,
        loose: 1.75,
      },
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '40px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        circle: '50%',
      },
      boxShadow: {
        card: '0 2px 6px rgba(0, 0, 0, 0.25)',
        panel: '0 1px 3px rgba(0, 0, 0, 0.2)',
        modal: '0 8px 16px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
} 
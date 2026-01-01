/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0D1117',
        surface: '#161B22',
        border: '#30363D',
        text: {
          primary: '#E6EDF3',
          secondary: '#7D8590',
        },
        accent: '#58A6FF',
        success: '#3FB950',
        warning: '#D29922',
        error: '#F85149',
      },
    },
  },
  plugins: [],
};

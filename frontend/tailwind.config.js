/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          highlight1: '#4735DD',
          highlight2: '#FF3E6C',
          highlight3: '#61BFC2',
          highlight4: '#FFA200',
          highlight5: '#51DC8E',
          background: '#21232E',
          text: '#dddedf',
        },
        fontFamily: {
          sans: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        },
        fontWeight: {
          bold: 700,
          semibold: 600,
          medium: 500,
        },
      },
    },
    plugins: [],
  }
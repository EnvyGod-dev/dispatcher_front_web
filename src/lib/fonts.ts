import localFont from 'next/font/local'
export const gipFont = localFont({
  src: [
    {
      path: '../../public/fonts/GIP-Medium.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/GIP-SemiBold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/GIP-Regular.otf',
      weight: '300',
      style: 'normal',
    },
  ],  
  variable: '--font-gip',
  display: 'swap', 
})
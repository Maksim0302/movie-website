import { Geist, Geist_Mono } from 'next/font/google'
import './globals.scss'
import Header from '@/components/Header/Header'
import Footer from '@/components/Footer/Footer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'КиноТерапия',
  description: 'Каталог фильмов и сериалов в стильном тёмном дизайне.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Header />

        <main>{children}</main>

        <Footer />
      </body>
    </html>
  )
}

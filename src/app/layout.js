import { Geist, Geist_Mono } from 'next/font/google'
import './globals.scss'
import Header from '@/components/Header/Header'
import Footer from '@/components/Footer/Footer'
import { getSiteUrl } from '@/lib/site'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const siteUrl = getSiteUrl()

export const metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,

  title: {
    default: 'КиноТерапия',
    template: '%s | КиноТерапия',
  },

  description:
    'Каталог фильмов и сериалов: лучшие новинки, жанры, трейлеры и онлайн-просмотр в одном месте.',

  verification: {
    google: 'pgnIJp98x4AINyr8BSJs-18x6LIYAVmplyPwSAZoIOQ',
  },

  alternates: {
    canonical: '/',
  },

  icons: {
    icon: '/img/logo/logo.png',
  },

  openGraph: {
    title: 'КиноТерапия',
    description:
      'Каталог фильмов и сериалов: лучшие новинки, жанры, трейлеры и онлайн-просмотр в одном месте.',
    url: '/',
    siteName: 'КиноТерапия',
    locale: 'ru_RU',
    type: 'website',
    images: [
      {
        url: '/img/logo/logo.png',
        width: 512,
        height: 512,
        alt: 'КиноТерапия',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'КиноТерапия',
    description:
      'Каталог фильмов и сериалов: лучшие новинки, жанры, трейлеры и онлайн-просмотр в одном месте.',
    images: ['/img/logo/logo.png'],
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Header />

        <main>{children}</main>

        <Footer />
      </body>
    </html>
  )
}

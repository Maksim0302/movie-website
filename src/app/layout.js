import { Geist, Geist_Mono } from 'next/font/google'
import './globals.scss'
import Header from '@/components/Header/Header'
import Footer from '@/components/Footer/Footer'
import { getAbsoluteUrl, getSiteUrl, serializeJsonLd } from '@/lib/site'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const siteUrl = getSiteUrl()
const absoluteSiteUrl = getAbsoluteUrl('/')

const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'КиноТерапия',
  alternateName: 'КиноТерапия',
  url: absoluteSiteUrl,
}

export const metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,

  title: {
    default: 'КиноТерапия',
    template: '%s | КиноТерапия',
  },

  applicationName: 'КиноТерапия',

  description:
    'Каталог фильмов и сериалов: лучшие новинки, жанры, трейлеры и онлайн-просмотр в одном месте.',

  verification: {
    google: 'pgnIJp98x4AINyr8BSJs-18x6LIYAVmplyPwSAZoIOQ',
  },

  icons: {
    icon: '/img/logo/logo.png',
  },

  openGraph: {
    title: 'КиноТерапия',
    description:
      'Каталог фильмов и сериалов: лучшие новинки, жанры, трейлеры и онлайн-просмотр в одном месте.',
    url: absoluteSiteUrl,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData).replace(
              /</g,
              '\\u003c'
            ),
          }}
        />

        <Header />

        <main>{children}</main>

        <Footer />
      </body>
    </html>
  )
}

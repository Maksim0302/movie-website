import Link from 'next/link'

import { genres } from '@/lib/genres'
import { getAbsoluteUrl } from '@/lib/site'

export const metadata = {
  title: 'Жанры',
  description:
    'Выберите жанр и находите фильмы и сериалы по настроению, стилю и теме в каталоге КиноТерапии.',
  alternates: {
    canonical: '/genres',
  },
  openGraph: {
    title: 'Жанры — КиноТерапия',
    description:
      'Выберите жанр и находите фильмы и сериалы по настроению, стилю и теме в каталоге КиноТерапии.',
    url: '/genres',
    type: 'website',
    images: [{ url: getAbsoluteUrl('/img/logo/logo.png'), width: 512, height: 512, alt: 'КиноТерапия' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Жанры — КиноТерапия',
    description:
      'Выберите жанр и находите фильмы и сериалы по настроению, стилю и теме в каталоге КиноТерапии.',
    images: [getAbsoluteUrl('/img/logo/logo.png')],
  },
}

export default function GenresPage() {
  return (
    <section
      className="container"
      style={{ paddingTop: 40, paddingBottom: 60 }}
    >
      <h1
        style={{
          color: '#fff',
          fontSize: 'clamp(24px, 4vw, 32px)',
          marginBottom: 24,
        }}
      >
        Популярные жанры
      </h1>

      <nav style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        {genres.map((genre) => (
          <Link
            key={genre.slug}
            href={`/genres/${genre.slug}`}
            style={{
              padding: 18,
              borderRadius: 12,
              background: '#0a1727',
              border: '1px solid #18324b',
              color: '#dfeaf8',
              minHeight: 52,
              overflowWrap: 'anywhere',
            }}
          >
            {genre.name}
          </Link>
        ))}
      </nav>
    </section>
  )
}

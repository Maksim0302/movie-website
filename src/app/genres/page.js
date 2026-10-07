import Link from 'next/link'

import { genres } from '@/lib/genres'

export const metadata = {
  title: 'Популярные жанры — КиноТерапия',
  description: 'Выберите жанр и найдите фильмы из каталога КиноТерапии.',
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

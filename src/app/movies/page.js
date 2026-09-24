import Link from 'next/link'
import Image from 'next/image'

import { getMovies } from '@/lib/movies'
import { getImageUrl } from '@/lib/tmdb'

export default async function MoviesPage() {
  const movies = await getMovies().catch(() => [])

  return (
    <section
      className="container"
      style={{ paddingTop: 40, paddingBottom: 60 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <h1 style={{ color: '#fff', fontSize: 32 }}>Фильмы</h1>
      </div>

      {movies.length === 0 ? (
        <div
          style={{
            padding: 28,
            borderRadius: 16,
            background: '#0a1727',
            border: '1px solid #18324b',
            color: '#dfeaf8',
          }}
        >
          В каталоге пока нет фильмов.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 18,
          }}
        >
          {movies.map((movie) => (
            <Link
              key={movie.slug}
              href={`/movies/${movie.slug}`}
              style={{ textDecoration: 'none', color: '#fff' }}
            >
              <div style={{ display: 'grid', gap: 8 }}>
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '0.67',
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: '#0d1b2b',
                    border: '1px solid #18324b',
                  }}
                >
                  <Image
                    src={movie.poster || getImageUrl(movie.poster_path)}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 180px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                <div>
                  <h2
                    style={{ fontSize: 14, color: '#dce7f3', marginBottom: 6 }}
                  >
                    {movie.title}
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#718298',
                      fontSize: 11,
                    }}
                  >
                    <span>{movie.release_date?.slice(0, 4) || '—'}</span>
                    <span style={{ color: '#cbd6e2' }}>
                      ★ {Number(movie.vote_average || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

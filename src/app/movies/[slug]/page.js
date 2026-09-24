import Image from 'next/image'
import { notFound } from 'next/navigation'

import VideoPlayer from '@/components/VideoPlayer/VideoPlayer'
import { getMovieBySlug } from '@/lib/movies'
import { getImageUrl } from '@/lib/tmdb'

export async function generateMetadata({ params }) {
  const slug = (await params).slug
  const movie = await getMovieBySlug(slug).catch(() => null)

  if (!movie) {
    return {
      title: 'Фильм не найден',
    }
  }

  return {
    title: `${movie.title} — КиноТерапия`,
    description: movie.overview || 'Просмотр фильма из каталога КиноТерапия.',
    openGraph: {
      title: `${movie.title} — КиноТерапия`,
      description: movie.overview || 'Просмотр фильма из каталога КиноТерапия.',
      images: movie.backdrop
        ? [movie.backdrop]
        : [getImageUrl(movie.poster_path)],
    },
  }
}

export default async function MovieDetailPage({ params }) {
  const slug = (await params).slug
  const movie = await getMovieBySlug(slug).catch(() => null)

  if (!movie) {
    notFound()
  }

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : '—'
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}ч ${movie.runtime % 60}мин`
    : '—'

  return (
    <section style={{ paddingBottom: 48 }}>
      <div style={{ position: 'relative', minHeight: 420, overflow: 'hidden' }}>
        <Image
          src={movie.backdrop || getImageUrl(movie.poster_path, 'w1280')}
          alt={movie.title}
          fill
          priority
          style={{ objectFit: 'cover' }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(4, 13, 25, 0.96) 0%, rgba(4, 13, 25, 0.88) 32%, rgba(4, 13, 25, 0.44) 60%, rgba(4, 13, 25, 0.78) 100%)',
          }}
        />

        <div
          className="container"
          style={{
            position: 'relative',
            zIndex: 1,
            paddingTop: 40,
            paddingBottom: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 28,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: 220,
                minWidth: 220,
                position: 'relative',
                aspectRatio: '2 / 3',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(146, 188, 242, 0.35)',
              }}
            >
              <Image
                src={movie.poster || getImageUrl(movie.poster_path)}
                alt={movie.title}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>

            <div style={{ flex: 1, color: '#fff', maxWidth: 760 }}>
              <h1 style={{ fontSize: 42, lineHeight: 1.1, marginBottom: 12 }}>
                {movie.title}
              </h1>
              <p style={{ color: '#c8d6ea', fontSize: 18, marginBottom: 12 }}>
                {movie.original_title}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  color: '#dfeaf8',
                  marginBottom: 18,
                  fontSize: 14,
                }}
              >
                <span>{releaseYear}</span>
                <span>•</span>
                <span>{runtime}</span>
                <span>•</span>
                <span>★ {Number(movie.vote_average || 0).toFixed(1)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 18,
                }}
              >
                {(movie.genres || []).slice(0, 5).map((genre) => (
                  <span
                    key={genre}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 999,
                      background: 'rgba(16, 91, 170, 0.65)',
                      border: '1px solid rgba(56, 145, 230, 0.25)',
                      color: '#dfeaf8',
                      fontSize: 12,
                    }}
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <p
                style={{
                  color: '#dbe7f8',
                  lineHeight: 1.7,
                  marginBottom: 24,
                  maxWidth: 680,
                }}
              >
                {movie.overview}
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {movie.videoUrl ? (
                  <a
                    href="#player"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 46,
                      padding: '0 20px',
                      background: '#087ef5',
                      borderRadius: 10,
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    Смотреть
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 36 }}>
        <div id="player" style={{ maxWidth: 960, margin: '0 auto' }}>
          <VideoPlayer src={movie.videoUrl || null} />
        </div>
      </div>
    </section>
  )
}

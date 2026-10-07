import Image from 'next/image'
import { notFound } from 'next/navigation'

import VideoPlayer from '../../../components/VideoPlayer/VideoPlayer'
import { getMovieBySlug } from '@/lib/movies'
import { getAbsoluteUrl } from '@/lib/site'
import { getImageUrl } from '@/lib/tmdb'
import styles from './MovieDetailPage.module.scss'

export async function generateMetadata({ params }) {
  const slug = (await params).slug
  const movie = await getMovieBySlug(slug).catch(() => null)

  if (!movie) {
    return {
      title: 'Фильм не найден',
      description: 'Такого фильма нет в каталоге КиноТерапии.',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const description =
    movie.overview || 'Просмотр фильма из каталога КиноТерапии.'
  const imageUrl = movie.backdrop || getImageUrl(movie.poster_path)

  return {
    title: `${movie.title} — смотреть фильм онлайн | КиноТерапия`,
    description,
    alternates: {
      canonical: `/movies/${movie.slug}`,
    },
    openGraph: {
      title: `${movie.title} — КиноТерапия`,
      description,
      url: `/movies/${movie.slug}`,
      type: 'video.movie',
      images: [{ url: imageUrl, alt: movie.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${movie.title} — КиноТерапия`,
      description,
      images: [imageUrl],
    },
  }
}

export default async function MovieDetailPage({ params }) {
  const slug = (await params).slug
  const movie = await getMovieBySlug(slug).catch((error) => {
    console.error('Movie detail page failed:', error)
    return null
  })

  if (!movie) {
    notFound()
  }

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : '—'
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}ч ${movie.runtime % 60}мин`
    : '—'
  const imageUrl = movie.backdrop || getImageUrl(movie.poster_path)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    image: imageUrl,
    description: movie.overview || 'Описание фильма отсутствует.',
    url: getAbsoluteUrl(`/movies/${movie.slug}`),
    ...(movie.release_date
      ? { datePublished: movie.release_date }
      : {}),
    genre: movie.genres || [],
  }

  return (
    <section className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className={styles.hero}>
        <Image
          src={movie.backdrop || getImageUrl(movie.poster_path, 'w1280')}
          alt={movie.title}
          fill
          priority
          className={styles.heroImage}
          sizes="100vw"
        />

        <div className={styles.heroOverlay} />

        <div className={`container ${styles.heroContent}`}>
          <div className={styles.movieLayout}>
            <div className={styles.poster}>
              <Image
                src={movie.poster || getImageUrl(movie.poster_path)}
                alt={movie.title}
                fill
                className={styles.posterImage}
                sizes="(max-width: 480px) 40vw, (max-width: 768px) 30vw, 240px"
              />
            </div>

            <div className={styles.movieInfo}>
              <h1 className={styles.title}>{movie.title}</h1>
              <p className={styles.originalTitle}>{movie.original_title}</p>

              <div className={styles.meta}>
                <span>{releaseYear}</span>
                <span>•</span>
                <span>{runtime}</span>
                <span>•</span>
                <span>★ {Number(movie.vote_average || 0).toFixed(1)}</span>
              </div>

              <div className={styles.genres}>
                {(movie.genres || []).slice(0, 5).map((genre) => (
                  <span key={genre} className={styles.genre}>
                    {genre}
                  </span>
                ))}
              </div>

              <p className={styles.overview}>{movie.overview}</p>

              <div className={styles.actions}>
                {movie.videoUrl ? (
                  <a href="#player" className={styles.watchButton}>
                    Смотреть
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`container ${styles.playerSection}`}>
        <div id="player" className={styles.playerContainer}>
          <VideoPlayer src={movie.videoUrl || null} />
        </div>
      </div>
    </section>
  )
}

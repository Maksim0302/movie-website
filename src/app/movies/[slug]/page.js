import Image from 'next/image'

import VideoPlayer from '../../../components/VideoPlayer/VideoPlayer'
import { getMovieBySlug } from '@/lib/movies'
import { getImageUrl } from '@/lib/tmdb'
import styles from './MovieDetailPage.module.scss'

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
  const movie = await getMovieBySlug(slug).catch((error) => {
    console.error('Movie detail page failed:', error)
    return null
  })

  if (!movie) {
    return (
      <section className={`container ${styles.messageSection}`}>
        <div className={styles.message}>Не удалось загрузить фильм.</div>
      </section>
    )
  }

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : '—'
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}ч ${movie.runtime % 60}мин`
    : '—'

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <Image
          src={movie.backdrop || getImageUrl(movie.poster_path, 'w1280')}
          alt={movie.title}
          fill
          priority
          className={styles.heroImage}
          sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, 180px"
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
                sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, 180px"
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

import Link from 'next/link'
import Image from 'next/image'

import MovieAvailabilityBadge from '@/components/MovieAvailabilityBadge/MovieAvailabilityBadge'
import SeriesBadge from '@/components/SeriesBadge/SeriesBadge'
import { getImageUrl } from '@/lib/tmdb'
import styles from './MovieGrid.module.scss'

export default function MovieGrid({
  movies = [],
  emptyMessage = 'В каталоге пока нет фильмов.',
  hrefPrefix = 'movies',
}) {
  if (movies.length === 0) {
    return <div className={styles.emptyState}>{emptyMessage}</div>
  }

  return (
    <div className={styles.grid}>
      {movies.map((movie) => {
        const itemHrefPrefix =
          movie.type === 'movie'
            ? 'movies'
            : movie.type === 'series'
              ? 'series'
              : hrefPrefix
        const isMovie = itemHrefPrefix === 'movies'
        const isSeries = itemHrefPrefix === 'series'
        const hasRating =
          movie.vote_average !== null &&
          movie.vote_average !== undefined &&
          movie.vote_average !== '' &&
          Number.isFinite(Number(movie.vote_average))

        return (
          <Link
            key={`${movie.type || itemHrefPrefix}-${movie.slug}`}
            href={`/${itemHrefPrefix}/${movie.slug}`}
            className={styles.card}
          >
            <div className={styles.cardContent}>
              <div className={styles.poster}>
                <Image
                  src={movie.poster || getImageUrl(movie.poster_path)}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, 180px"
                  className={styles.posterImage}
                />
              </div>

              {isSeries ? (
                <SeriesBadge />
              ) : null}

              {isMovie ? (
                <MovieAvailabilityBadge status={movie.availability_status} />
              ) : null}
              {isSeries && movie.series_has_episodes ? (
                <MovieAvailabilityBadge status="series_available" />
              ) : null}
              {isSeries && movie.series_has_trailer ? (
                <MovieAvailabilityBadge status="trailer_only" />
              ) : null}

              <div className={styles.cardDetails}>
                <h2 className={styles.title}>{movie.title}</h2>
                <div className={styles.info}>
                  <span>{movie.release_date?.slice(0, 4) || '—'}</span>
                  {hasRating ? (
                    <span className={styles.rating}>
                      ★ {Number(movie.vote_average).toFixed(1)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

import Link from 'next/link'
import Image from 'next/image'

import MovieAvailabilityBadge from '@/components/MovieAvailabilityBadge/MovieAvailabilityBadge'
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
      {movies.map((movie) => (
        <Link
          key={movie.slug}
          href={`/${hrefPrefix}/${movie.slug}`}
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

            {hrefPrefix === 'movies' ? (
              <MovieAvailabilityBadge status={movie.availability_status} />
            ) : null}

            <div className={styles.cardDetails}>
              <h2 className={styles.title}>{movie.title}</h2>
              <div className={styles.info}>
                <span>{movie.release_date?.slice(0, 4) || '—'}</span>
                <span className={styles.rating}>
                  ★ {Number(movie.vote_average || 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

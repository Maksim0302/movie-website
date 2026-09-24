import Link from 'next/link'
import Image from 'next/image'

import styles from './PopularMovies.module.scss'

import { getImageUrl } from '@/lib/tmdb'

export default function PopularMovies({ movies = [] }) {
  const visibleMovies = Array.isArray(movies) ? movies.slice(0, 7) : []

  if (visibleMovies.length === 0) {
    return (
      <section className={styles.section}>
        <div className="container">
          <div className={styles.header}>
            <h2 className={styles.title}>Фильмы</h2>
          </div>

          <div className={styles.emptyState}>
            Фильмы в каталоге ещё не добавлены.
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Фильмы</h2>

          <Link href="/movies" className={styles.all}>
            Смотреть все <span>→</span>
          </Link>
        </div>

        <div className={styles.grid}>
          {visibleMovies.map((movie) => (
            <Link
              href={`/movies/${movie.slug}`}
              className={styles.card}
              key={movie.slug || movie.id}
            >
              <div className={styles.poster}>
                <Image
                  src={movie.poster || getImageUrl(movie.poster_path)}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 768px) 140px, 180px"
                />
              </div>

              <h3 className={styles.name}>{movie.title}</h3>

              <div className={styles.info}>
                <span>{movie.release_date?.slice(0, 4) || '—'}</span>

                <span className={styles.rating}>
                  <span>★</span>

                  {Number(movie.vote_average || 0).toFixed(1)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

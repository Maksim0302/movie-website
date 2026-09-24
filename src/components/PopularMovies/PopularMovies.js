import Link from 'next/link'
import Image from 'next/image'

import styles from './PopularMovies.module.scss'

import { getImageUrl } from '@/lib/tmdb'

export default function PopularMovies({ movies }) {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Популярные фильмы</h2>

          <Link href="/movies" className={styles.all}>
            Смотреть все <span>→</span>
          </Link>
        </div>

        <div className={styles.grid}>
          {movies.slice(0, 7).map((movie) => (
            <Link
              href={`/movies/${movie.id}`}
              className={styles.card}
              key={movie.id}
            >
              <div className={styles.poster}>
                <Image
                  src={getImageUrl(movie.poster_path)}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 768px) 140px, 180px"
                />
              </div>

              <h3 className={styles.name}>{movie.title}</h3>

              <div className={styles.info}>
                <span>{movie.release_date?.slice(0, 4)}</span>

                <span className={styles.rating}>
                  <span>★</span>

                  {movie.vote_average.toFixed(1)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

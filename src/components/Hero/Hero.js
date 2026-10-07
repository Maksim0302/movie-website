'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './Hero.module.scss'

export default function Hero({ movies = [] }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (movies.length < 2) {
      return
    }

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % movies.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [movies.length])

  if (movies.length === 0) {
    return null
  }

  const activeSlide = currentSlide % movies.length
  const movie = movies[activeSlide]
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null
  const duration = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}ч ${movie.runtime % 60}мин`
    : null
  const description =
    movie.overview?.length > 200
      ? `${movie.overview.slice(0, 197).trimEnd()}...`
      : movie.overview

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % movies.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + movies.length) % movies.length)
  }

  return (
    <section className={styles.hero}>
      <div className={styles.slide}>
        <Image
          src={movie.backdrop}
          alt={movie.title}
          fill
          priority
          className={styles.background}
        />

        <div className={styles.overlay}></div>

        <div className="container">
          <div className={styles.content}>
            <h1 className={styles.title}>{movie.title}</h1>

            {(year || duration || movie.vote_average) && (
              <div className={styles.meta}>
                {year && <span>{year}</span>}
                {year && duration && <span>•</span>}
                {duration && <span>{duration}</span>}
                {(year || duration) && movie.vote_average > 0 && (
                  <span>•</span>
                )}
                {movie.vote_average > 0 && (
                  <span>★ {Number(movie.vote_average).toFixed(1)}</span>
                )}
              </div>
            )}

            <div className={styles.genres}>
              {(movie.genres || []).map((genre) => (
                <span key={genre}>{genre}</span>
              ))}
            </div>

            <p className={styles.description}>{description}</p>

            <div className={styles.actions}>
              <Link href={`/movies/${movie.slug}`} className={styles.watch}>
                <span>▶</span>
                Смотреть
              </Link>

              <Link href={`/movies/${movie.slug}`} className={styles.details}>
                Подробнее
              </Link>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`${styles.arrow} ${styles.prev}`}
          onClick={prevSlide}
          aria-label="Предыдущий фильм"
          disabled={movies.length < 2}
        >
          ‹
        </button>

        <button
          type="button"
          className={`${styles.arrow} ${styles.next}`}
          onClick={nextSlide}
          aria-label="Следующий фильм"
          disabled={movies.length < 2}
        >
          ›
        </button>

        <div className={styles.pagination}>
          {movies.map((movie, index) => (
            <button
              key={movie.tmdb_id}
              type="button"
              className={`${styles.dot} ${
                index === activeSlide ? styles.active : ''
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Слайд ${index + 1}`}
              aria-current={index === activeSlide ? 'true' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

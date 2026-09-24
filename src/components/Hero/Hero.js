'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './Hero.module.scss'

const movies = [
  {
    id: 1,
    title: 'Интерстеллар',
    year: '2014',
    duration: '2ч 49мин',
    age: '12+',
    rating: '8.7',
    imdb: '8.6',
    genres: ['Драма', 'Фантастика', 'Приключения'],
    description:
      'Когда Земля оказывается на грани вымирания, группа исследователей отправляется в космос на поиски нового дома для человечества.',
    image: '/img/hero/interstellar.jpeg',
  },
  {
    id: 2,
    title: 'Начало',
    year: '2010',
    duration: '2ч 28мин',
    age: '12+',
    rating: '8.8',
    imdb: '8.8',
    genres: ['Фантастика', 'Триллер', 'Драма'],
    description:
      'Профессиональный вор проникает в сны людей, чтобы украсть самые сокровенные идеи и секреты.',
    image: '/img/hero/inception.jpeg',
  },
  {
    id: 3,
    title: 'Дюна',
    year: '2021',
    duration: '2ч 35мин',
    age: '12+',
    rating: '8.0',
    imdb: '8.0',
    genres: ['Фантастика', 'Драма', 'Приключения'],
    description:
      'Молодой наследник отправляется на опасную планету, где ему предстоит столкнуться с судьбой своей семьи.',
    image: '/img/hero/dune.jpeg',
  },
]

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)

  //   useEffect(() => {
  //     const timer = setInterval(() => {
  //       setCurrentSlide((prev) => (prev + 1) % movies.length)
  //     }, 5000)

  //     return () => clearInterval(timer)
  //   }, [])

  const movie = movies[currentSlide]

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
          src={movie.image}
          alt={movie.title}
          fill
          priority
          className={styles.background}
        />

        <div className={styles.overlay}></div>

        <div className="container">
          <div className={styles.content}>
            <h1 className={styles.title}>{movie.title}</h1>

            <div className={styles.meta}>
              <span>{movie.year}</span>
              <span>•</span>
              <span>{movie.duration}</span>
              <span>•</span>
              <span>{movie.age}</span>
            </div>

            <div className={styles.genres}>
              {movie.genres.map((genre) => (
                <span key={genre}>{genre}</span>
              ))}
            </div>

            <p className={styles.description}>{movie.description}</p>

            <div className={styles.actions}>
              <Link href="/watch" className={styles.watch}>
                <span>▶</span>
                Смотреть
              </Link>

              <Link href={`/movies/${movie.id}`} className={styles.details}>
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
        >
          ‹
        </button>

        <button
          type="button"
          className={`${styles.arrow} ${styles.next}`}
          onClick={nextSlide}
          aria-label="Следующий фильм"
        >
          ›
        </button>

        <div className={styles.pagination}>
          {movies.map((movie, index) => (
            <button
              key={movie.id}
              type="button"
              className={`${styles.dot} ${
                index === currentSlide ? styles.active : ''
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Слайд ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

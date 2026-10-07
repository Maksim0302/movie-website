import { notFound } from 'next/navigation'

import MovieGrid from '@/components/MovieGrid/MovieGrid'
import { getGenreBySlug } from '@/lib/genres'
import { getMoviesByGenre } from '@/lib/movies'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const genre = getGenreBySlug(slug)

  if (!genre) {
    return { title: 'Жанр не найден — КиноТерапия' }
  }

  const description = `Лучшие ${genre.name.toLocaleLowerCase('ru-RU')} из каталога КиноТерапии.`

  return {
    title: `${genre.name} — КиноТерапия`,
    description,
  }
}

export default async function GenrePage({ params }) {
  const { slug } = await params
  const genre = getGenreBySlug(slug)

  if (!genre) {
    notFound()
  }

  const movies = await getMoviesByGenre(genre.id)

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
        <h1 style={{ color: '#fff', fontSize: 'clamp(24px, 4vw, 32px)' }}>
          {genre.name}
        </h1>
      </div>

      <MovieGrid
        movies={movies}
        emptyMessage="Фильмов в этом жанре пока нет."
      />
    </section>
  )
}

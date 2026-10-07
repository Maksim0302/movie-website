import { notFound } from 'next/navigation'

import MovieGrid from '@/components/MovieGrid/MovieGrid'
import { getGenreBySlug } from '@/lib/genres'
import { getMoviesByGenre } from '@/lib/movies'
import { getAbsoluteUrl } from '@/lib/site'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const genre = getGenreBySlug(slug)

  if (!genre) {
    return {
      title: 'Жанр не найден',
      description: 'Такого жанра нет в каталоге КиноТерапии.',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const description = `Смотрите ${genre.name.toLowerCase()} в каталоге КиноТерапии — подборки фильмов, новинки и лучшие картины по жанру.`

  return {
    title: `${genre.name} — КиноТерапия`,
    description,
    alternates: {
      canonical: `/genres/${genre.slug}`,
    },
    openGraph: {
      title: `${genre.name} — КиноТерапия`,
      description,
      url: `/genres/${genre.slug}`,
      type: 'website',
      images: [{ url: getAbsoluteUrl('/img/logo/logo.png'), width: 512, height: 512, alt: 'КиноТерапия' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${genre.name} — КиноТерапия`,
      description,
      images: [getAbsoluteUrl('/img/logo/logo.png')],
    },
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

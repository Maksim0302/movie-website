import { notFound } from 'next/navigation'

import MovieCatalog from '@/components/MovieCatalog/MovieCatalog'
import { getGenreBySlug } from '@/lib/genres'
import { getMoviesByGenre } from '@/lib/movies'
import { getSeriesByGenre } from '@/lib/series'
import { getMovieSort } from '@/lib/movie-sorting'
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

  const description = `Смотрите ${genre.name.toLowerCase()} в каталоге КиноТерапии — подборки фильмов и сериалов по жанру.`

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

export default async function GenrePage({ params, searchParams }) {
  const { slug } = await params
  const { page: requestedPage, sort: requestedSort } = await searchParams
  const genre = getGenreBySlug(slug)

  if (!genre) {
    notFound()
  }

  const [movies, series] = await Promise.all([
    getMoviesByGenre(genre.id),
    getSeriesByGenre(genre.seriesId),
  ])
  const content = [
    ...movies.map((movie) => ({ ...movie, type: 'movie' })),
    ...series,
  ]
  const parsedPage = Number.parseInt(requestedPage, 10)
  const initialPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1

  return (
    <section
      className="container"
      style={{ paddingTop: 40, paddingBottom: 60 }}
    >
      <MovieCatalog
        movies={content}
        initialPage={initialPage}
        initialSort={getMovieSort(requestedSort).id}
        emptyMessage="Фильмов и сериалов в этом жанре пока нет."
        title={genre.name}
      />
    </section>
  )
}

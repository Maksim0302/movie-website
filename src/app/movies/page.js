import { getMovies } from '@/lib/movies'
import { getMovieSort } from '@/lib/movie-sorting'
import MovieCatalog from '@/components/MovieCatalog/MovieCatalog'
import { getAbsoluteUrl } from '@/lib/site'

export const metadata = {
  title: 'Фильмы',
  description: 'Смотрите фильмы онлайн в каталоге КиноТерапии — новинки, драмы, боевики и популярные подборки.',
  alternates: {
    canonical: '/movies',
  },
  openGraph: {
    title: 'Фильмы — КиноТерапия',
    description:
      'Смотрите фильмы онлайн в каталоге КиноТерапии — новинки, драмы, боевики и популярные подборки.',
    url: '/movies',
    type: 'website',
    images: [{ url: getAbsoluteUrl('/img/logo/logo.png'), width: 512, height: 512, alt: 'КиноТерапия' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Фильмы — КиноТерапия',
    description:
      'Смотрите фильмы онлайн в каталоге КиноТерапии — новинки, драмы, боевики и популярные подборки.',
    images: [getAbsoluteUrl('/img/logo/logo.png')],
  },
}

function normalizeSearchText(value) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('ru-RU')
}

export default async function MoviesPage({ searchParams }) {
  const {
    page: requestedPage,
    search: requestedSearch,
    sort: requestedSort,
  } = await searchParams
  const searchQuery =
    typeof requestedSearch === 'string' ? requestedSearch.trim() : ''
  const catalog = await getMovies().catch(() => [])
  const normalizedQuery = normalizeSearchText(searchQuery)
  const movies = normalizedQuery
    ? catalog.filter((movie) =>
        [movie.title, movie.original_title].some(
          (title) =>
            typeof title === 'string' &&
            normalizeSearchText(title).includes(normalizedQuery)
        )
      )
    : catalog
  const parsedPage = Number.parseInt(requestedPage, 10)
  const initialPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1

  return (
    <section
      className="container"
      style={{ paddingTop: 40, paddingBottom: 60 }}
    >
      <MovieCatalog
        movies={movies}
        initialPage={initialPage}
        initialSort={getMovieSort(requestedSort).id}
        searchQuery={searchQuery}
        title="Фильмы"
      />
    </section>
  )
}

import { getSeries } from '@/lib/series'
import { getMovieSort } from '@/lib/movie-sorting'
import MovieCatalog from '@/components/MovieCatalog/MovieCatalog'
import { getAbsoluteUrl } from '@/lib/site'

export const revalidate = 60

export const metadata = {
  title: 'Сериалы',
  description:
    'Смотрите сериалы онлайн в каталоге КиноТерапии — детективы, драмы, фантастика и популярные новинки.',
  alternates: {
    canonical: '/series',
  },
  openGraph: {
    title: 'Сериалы — КиноТерапия',
    description:
      'Смотрите сериалы онлайн в каталоге КиноТерапии — детективы, драмы, фантастика и популярные новинки.',
    url: '/series',
    type: 'website',
    images: [
      {
        url: getAbsoluteUrl('/img/logo/logo.png'),
        width: 512,
        height: 512,
        alt: 'КиноТерапия',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Сериалы — КиноТерапия',
    description:
      'Смотрите сериалы онлайн в каталоге КиноТерапии — детективы, драмы, фантастика и популярные новинки.',
    images: [getAbsoluteUrl('/img/logo/logo.png')],
  },
}

export default async function SeriesPage({ searchParams }) {
  const { page: requestedPage, sort: requestedSort } = await searchParams
  const series = await getSeries()
  const parsedPage = Number.parseInt(requestedPage, 10)
  const initialPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1

  return (
    <section
      className="container"
      style={{ paddingTop: 40, paddingBottom: 60 }}
    >
      <MovieCatalog
        movies={series}
        initialPage={initialPage}
        initialSort={getMovieSort(requestedSort).id}
        title="Сериалы"
        entityName="сериалов"
        hrefPrefix="series"
        emptyMessage="В каталоге пока нет сериалов."
      />
    </section>
  )
}

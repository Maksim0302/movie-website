import { getSeries } from '@/lib/series'
import MovieGrid from '@/components/MovieGrid/MovieGrid'
import { getAbsoluteUrl } from '@/lib/site'

export const revalidate = 60

export const metadata = {
  title: 'Сериалы',
  description: 'Смотрите сериалы онлайн в каталоге КиноТерапии — детективы, драмы, фантастика и популярные новинки.',
  alternates: {
    canonical: '/series',
  },
  openGraph: {
    title: 'Сериалы — КиноТерапия',
    description:
      'Смотрите сериалы онлайн в каталоге КиноТерапии — детективы, драмы, фантастика и популярные новинки.',
    url: '/series',
    type: 'website',
    images: [{ url: getAbsoluteUrl('/img/logo/logo.png'), width: 512, height: 512, alt: 'КиноТерапия' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Сериалы — КиноТерапия',
    description:
      'Смотрите сериалы онлайн в каталоге КиноТерапии — детективы, драмы, фантастика и популярные новинки.',
    images: [getAbsoluteUrl('/img/logo/logo.png')],
  },
}

export default async function SeriesPage() {
  const series = await getSeries()

  return (
    <section
      className="container"
      style={{ paddingTop: 40, paddingBottom: 60 }}
    >
      <h1
        style={{
          color: '#fff',
          fontSize: 'clamp(24px, 4vw, 32px)',
          marginBottom: 24,
        }}
      >
        Сериалы
      </h1>

      <MovieGrid
        movies={series}
        hrefPrefix="series"
        emptyMessage="В каталоге пока нет сериалов."
      />
    </section>
  )
}

import { getMovies } from '@/lib/movies'
import MovieGrid from '@/components/MovieGrid/MovieGrid'
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

export default async function MoviesPage() {
  const movies = await getMovies().catch(() => [])

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
          Фильмы
        </h1>
      </div>

      <MovieGrid movies={movies} />
    </section>
  )
}

import { getSeries } from '@/lib/series'
import MovieGrid from '@/components/MovieGrid/MovieGrid'

export const revalidate = 60

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

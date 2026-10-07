import { getMovies } from '@/lib/movies'
import MovieGrid from '@/components/MovieGrid/MovieGrid'

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

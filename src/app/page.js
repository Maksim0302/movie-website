import Hero from '@/components/Hero/Hero'
import PopularMovies from '@/components/PopularMovies/PopularMovies'
import PopularSeries from '@/components/PopularSeries/PopularSeries'

import { getMovies } from '@/lib/movies'
import { getPopularSeries } from '@/lib/tmdb'

export default async function Home() {
  const movies = await getMovies().catch(() => [])
  const seriesData = await getPopularSeries().catch(() => ({ results: [] }))

  return (
    <>
      <Hero />

      <PopularMovies movies={movies} />

      <PopularSeries series={seriesData.results} />
    </>
  )
}

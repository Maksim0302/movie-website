import Hero from '@/components/Hero/Hero'
import PopularMovies from '@/components/PopularMovies/PopularMovies'
import PopularSeries from '@/components/PopularSeries/PopularSeries'

import { getMovies, getPopularMovies } from '@/lib/movies'
import { getSeries } from '@/lib/series'

export const revalidate = 60

export default async function Home() {
  const movies = await getMovies().catch(() => [])
  const series = await getSeries()
  const heroMovies = getPopularMovies(movies, 3)

  return (
    <>
      <Hero movies={heroMovies} />

      <PopularMovies movies={movies} />

      <PopularSeries series={series} />
    </>
  )
}

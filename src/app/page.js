import Hero from '@/components/Hero/Hero'
import PopularMovies from '@/components/PopularMovies/PopularMovies'
import PopularSeries from '@/components/PopularSeries/PopularSeries'

import { getMovies, getPopularMovies, sortByRating } from '@/lib/movies'
import { getSeries } from '@/lib/series'

export const revalidate = 60

export default async function Home() {
  const movies = await getMovies().catch(() => [])
  const series = await getSeries()
  const heroMovies = getPopularMovies(movies, 3)
  const popularMovies = getPopularMovies(movies, 7)

  return (
    <>
      <Hero movies={heroMovies} />

      <PopularMovies movies={popularMovies} />

      <PopularSeries series={sortByRating(series)} />
    </>
  )
}

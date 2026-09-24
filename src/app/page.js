import Hero from '@/components/Hero/Hero'
import PopularMovies from '@/components/PopularMovies/PopularMovies'
import PopularSeries from '@/components/PopularSeries/PopularSeries'

import { getPopularMovies, getPopularSeries } from '@/lib/tmdb'

export default async function Home() {
  const moviesData = await getPopularMovies()
  const seriesData = await getPopularSeries()

  return (
    <>
      <Hero />

      <PopularMovies movies={moviesData.results} />

      <PopularSeries series={seriesData.results} />
    </>
  )
}

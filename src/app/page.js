import Hero from '@/components/Hero/Hero'
import PopularMovies from '@/components/PopularMovies/PopularMovies'
import PopularSeries from '@/components/PopularSeries/PopularSeries'

import { getMovies, getPopularMovies, sortByRating } from '@/lib/movies'
import { getSeries } from '@/lib/series'
import { getAbsoluteUrl, serializeJsonLd } from '@/lib/site'

export const revalidate = 60

export const metadata = {
  alternates: {
    canonical: getAbsoluteUrl('/'),
  },
}

const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'КиноТерапия',
  alternateName: 'kinoterapiya',
  url: getAbsoluteUrl('/'),
}

export default async function Home() {
  const movies = await getMovies().catch(() => [])
  const series = await getSeries()
  const heroMovies = getPopularMovies(movies, 3)
  const popularMovies = getPopularMovies(movies, 7)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(websiteStructuredData),
        }}
      />

      <Hero movies={heroMovies} />

      <PopularMovies movies={popularMovies} />

      <PopularSeries series={sortByRating(series)} />
    </>
  )
}

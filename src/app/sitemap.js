import { genres } from '@/lib/genres'
import { getMovies } from '@/lib/movies'
import { getSeries } from '@/lib/series'
import { getAbsoluteUrl } from '@/lib/site'

export default async function sitemap() {
  const movieEntries = await getMovies().catch(() => [])
  const seriesEntries = await getSeries().catch(() => [])

  const staticRoutes = [
    '/',
    '/movies',
    '/series',
    '/genres',
    ...genres.map((genre) => `/genres/${genre.slug}`),
  ]

  const staticUrls = staticRoutes.map((route) => ({
    url: getAbsoluteUrl(route),
    lastModified: new Date(),
    changefreq: 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }))

  const movieUrls = movieEntries.map((movie) => ({
    url: getAbsoluteUrl(`/movies/${movie.slug}`),
    lastModified: movie.created_at ? new Date(movie.created_at) : new Date(),
    changefreq: 'weekly',
    priority: 0.8,
  }))

  const seriesUrls = seriesEntries.map((seriesItem) => ({
    url: getAbsoluteUrl(`/series/${seriesItem.slug}`),
    lastModified: seriesItem.created_at
      ? new Date(seriesItem.created_at)
      : new Date(),
    changefreq: 'weekly',
    priority: 0.8,
  }))

  return [...staticUrls, ...movieUrls, ...seriesUrls]
}

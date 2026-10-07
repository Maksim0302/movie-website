import { getCloudflareHlsUrl } from './cloudflare'
import { getSupabaseServerClient } from './supabase'
import { getImageUrl, getMovie } from './tmdb'

const GENRE_CATALOG_LIMIT = 100
const MOVIE_METADATA_CONCURRENCY = 8

export function getPopularMovies(movies = [], limit = 3) {
  const requestedLimit = Number.isInteger(Number(limit)) ? Number(limit) : 3
  const resultLimit = Math.min(3, Math.max(0, requestedLimit))

  return [...movies]
    .sort((first, second) => {
      const ratingDifference =
        Number(second.vote_average || 0) - Number(first.vote_average || 0)

      if (ratingDifference !== 0) {
        return ratingDifference
      }

      return (
        new Date(second.created_at || 0).getTime() -
        new Date(first.created_at || 0).getTime()
      )
    })
    .slice(0, resultLimit)
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(items[index])
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, items.length) },
      () => worker()
    )
  )

  return results
}

export async function getMoviesByGenre(genreId) {
  const numericGenreId = Number(genreId)

  if (!Number.isInteger(numericGenreId) || numericGenreId <= 0) {
    return []
  }

  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(GENRE_CATALOG_LIMIT)

    if (error) {
      console.error('Supabase getMoviesByGenre error:', error.message)
      return []
    }

    const hydratedMovies = await mapWithConcurrency(
      data || [],
      MOVIE_METADATA_CONCURRENCY,
      async (movie) => {
        try {
          const metadata = await getMovie(movie.tmdb_id)

          if (!metadata?.genre_ids?.includes(numericGenreId)) {
            return null
          }

          return {
            ...movie,
            ...metadata,
            poster: getImageUrl(metadata.poster_path),
            backdrop: getImageUrl(metadata.backdrop_path, 'w1280'),
            videoUrl: getCloudflareHlsUrl(movie.video_id),
          }
        } catch (movieError) {
          console.error('Failed to hydrate movie by genre:', movieError)
          return null
        }
      }
    )

    return hydratedMovies.filter(Boolean)
  } catch (error) {
    console.error('Supabase getMoviesByGenre failed:', error)
    return []
  }
}

export async function getMovies() {
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase getMovies error:', error.message)
      return []
    }

    const enrichedMovies = await Promise.all(
      (data || []).map(async (movie) => {
        try {
          const metadata = await getMovie(movie.tmdb_id)

          if (!metadata) {
            return null
          }

          return {
            ...movie,
            ...metadata,
            poster: getImageUrl(metadata.poster_path),
            backdrop: getImageUrl(metadata.backdrop_path, 'w1280'),
            videoUrl: getCloudflareHlsUrl(movie.video_id),
          }
        } catch (movieError) {
          console.error('Failed to hydrate movie:', movieError)
          return null
        }
      })
    )

    return enrichedMovies.filter(Boolean)
  } catch (error) {
    console.error('Supabase getMovies failed:', error)
    return []
  }
}

export async function getMovieBySlug(slug) {
  if (!slug) {
    return null
  }

  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      console.error('Supabase getMovieBySlug error:', error.message)
      return null
    }

    if (!data) {
      return null
    }

    const metadata = await getMovie(data.tmdb_id)

    if (!metadata) {
      return null
    }

    return {
      ...data,
      ...metadata,
      poster: getImageUrl(metadata.poster_path),
      backdrop: getImageUrl(metadata.backdrop_path, 'w1280'),
      videoUrl: getCloudflareHlsUrl(data.video_id),
    }
  } catch (error) {
    console.error('getMovieBySlug failed:', error)
    return null
  }
}

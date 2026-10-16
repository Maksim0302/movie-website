import { getVideoUrl } from './cloudflare'
import { getMovieAvailabilityStatus } from './movie-availability'
import { getSupabaseServerClient } from './supabase'
import { getImageUrl, getMovie } from './tmdb'

const GENRE_CATALOG_LIMIT = 100
const MOVIE_METADATA_CONCURRENCY = 8

export function sortByRating(items = []) {
  return [...(Array.isArray(items) ? items : [])].sort((first, second) => {
    const firstRating = getMovieRating(first)
    const secondRating = getMovieRating(second)

    if (firstRating === null && secondRating !== null) {
      return 1
    }

    if (firstRating !== null && secondRating === null) {
      return -1
    }

    if (firstRating !== null && secondRating !== null) {
      const ratingDifference = secondRating - firstRating

      if (ratingDifference !== 0) {
        return ratingDifference
      }
    }

    return getCreatedAtTimestamp(second) - getCreatedAtTimestamp(first)
  })
}

export function getPopularMovies(movies = [], limit = 3) {
  const requestedLimit = Number.isInteger(Number(limit)) ? Number(limit) : 3
  const resultLimit = Math.max(0, requestedLimit)

  return sortByRating(movies).slice(0, resultLimit)
}

function getMovieRating(movie) {
  if (
    movie?.vote_average === null ||
    movie?.vote_average === undefined ||
    movie.vote_average === ''
  ) {
    return null
  }

  const rating = Number(movie.vote_average)
  return Number.isFinite(rating) ? rating : null
}

function getCreatedAtTimestamp(movie) {
  const timestamp = new Date(movie?.created_at || 0).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
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
            availability_status: getMovieAvailabilityStatus(movie),
            poster: getImageUrl(metadata.poster_path),
            backdrop: getImageUrl(metadata.backdrop_path, 'w1280'),
            videoUrl: getVideoUrl(movie.video_id),
            trailerVideoUrl: getVideoUrl(movie.trailer_video_id),
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
            availability_status: getMovieAvailabilityStatus(movie),
            poster: getImageUrl(metadata.poster_path),
            backdrop: getImageUrl(metadata.backdrop_path, 'w1280'),
            videoUrl: getVideoUrl(movie.video_id),
            trailerVideoUrl: getVideoUrl(movie.trailer_video_id),
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
      availability_status: getMovieAvailabilityStatus(data),
      poster: getImageUrl(metadata.poster_path),
      backdrop: getImageUrl(metadata.backdrop_path, 'w1280'),
      videoUrl: getVideoUrl(data.video_id),
      trailerVideoUrl: getVideoUrl(data.trailer_video_id),
    }
  } catch (error) {
    console.error('getMovieBySlug failed:', error)
    return null
  }
}

import { getCloudflareHlsUrl } from './cloudflare'
import { getSupabaseServerClient } from './supabase'
import { getImageUrl, getMovie } from './tmdb'

export async function getMovies() {
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message || 'Не удалось получить фильмы из Supabase')
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
      } catch {
        return null
      }
    })
  )

  return enrichedMovies.filter(Boolean)
}

export async function getMovieBySlug(slug) {
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw new Error(error.message || 'Не удалось получить фильм по slug')
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
}

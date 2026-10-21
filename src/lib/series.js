import { getVideoUrl } from './cloudflare'
import { getSupabaseServerClient } from './supabase'
import { getImageUrl, getSeriesByTmdbId } from './tmdb'

const SERIES_GENRE_CATALOG_PAGE_SIZE = 500
const SERIES_METADATA_CONCURRENCY = 8

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

async function hydrateSeries(series, includeEpisodes = false) {
  try {
    const metadata = await getSeriesByTmdbId(series.tmdb_id)

    if (!metadata) {
      return null
    }

    const result = {
      ...series,
      ...metadata,
      poster: getImageUrl(metadata.poster_path),
      backdrop: getImageUrl(metadata.backdrop_path, 'w1280'),
      videoUrl: getVideoUrl(series.video_id),
    }

    if (includeEpisodes) {
      const supabase = getSupabaseServerClient()
      const { data: seasons, error: seasonsError } = await supabase
        .from('series_seasons')
        .select('id, season_number')
        .eq('series_id', series.id)
        .order('season_number', { ascending: true })

      if (seasonsError) {
        throw seasonsError
      }

      const seasonIds = (seasons || []).map((season) => season.id)
      const { data: episodes, error: episodesError } = seasonIds.length
        ? await supabase
            .from('series_episodes')
            .select(
              'season_id, episode_number, duration_minutes, video_path'
            )
            .in('season_id', seasonIds)
            .order('episode_number', { ascending: true })
        : { data: [], error: null }

      if (episodesError) {
        throw episodesError
      }

      result.seasons = (seasons || [])
        .map((season) => ({
          seasonNumber: season.season_number,
          episodes: (episodes || [])
            .filter((episode) => episode.season_id === season.id)
            .map((episode) => ({
              episodeNumber: episode.episode_number,
              runtime: episode.duration_minutes,
              videoUrl: getVideoUrl(episode.video_path),
            }))
            .filter((episode) => episode.videoUrl),
        }))
        .filter((season) => season.episodes.length > 0)
    }

    return result
  } catch (error) {
    console.error('Failed to hydrate series:', error)
    return null
  }
}

export async function getSeriesByGenre(genreId) {
  const numericGenreId = Number(genreId)

  if (!Number.isInteger(numericGenreId) || numericGenreId <= 0) {
    return []
  }

  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return []
  }

  try {
    const catalog = []
    let offset = 0

    while (true) {
      const { data, error } = await supabase
        .from('series')
        .select(
          'id, tmdb_id, slug, video_id, youtube_url, telegram_url, created_at'
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + SERIES_GENRE_CATALOG_PAGE_SIZE - 1)

      if (error) {
        console.error('Supabase getSeriesByGenre error:', error.message)
        return []
      }

      catalog.push(...(data || []))

      if (!data || data.length < SERIES_GENRE_CATALOG_PAGE_SIZE) {
        break
      }

      offset += SERIES_GENRE_CATALOG_PAGE_SIZE
    }

    const hydratedSeries = await mapWithConcurrency(
      catalog,
      SERIES_METADATA_CONCURRENCY,
      async (seriesItem) => {
        try {
          const metadata = await getSeriesByTmdbId(seriesItem.tmdb_id)

          if (!metadata?.genre_ids?.includes(numericGenreId)) {
            return null
          }

          return {
            ...seriesItem,
            ...metadata,
            poster: getImageUrl(metadata.poster_path),
            backdrop: getImageUrl(metadata.backdrop_path, 'w1280'),
            videoUrl: getVideoUrl(seriesItem.video_id),
            type: 'series',
          }
        } catch (seriesError) {
          console.error('Failed to hydrate series by genre:', seriesError)
          return null
        }
      }
    )

    return hydratedSeries.filter(Boolean)
  } catch (error) {
    console.error('Supabase getSeriesByGenre failed:', error)
    return []
  }
}

export async function getSeries() {
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('series')
      .select(
        'id, tmdb_id, slug, video_id, youtube_url, telegram_url, created_at'
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase getSeries error:', error.message)
      return []
    }

    const hydratedSeries = await Promise.all(
      (data || []).map((seriesItem) => hydrateSeries(seriesItem))
    )

    return hydratedSeries.filter(Boolean)
  } catch (error) {
    console.error('Supabase getSeries failed:', error)
    return []
  }
}

export async function getSeriesBySlug(slug) {
  if (!slug) {
    return null
  }

  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('series')
      .select(
        'id, tmdb_id, slug, video_id, youtube_url, telegram_url, created_at'
      )
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      console.error('Supabase getSeriesBySlug error:', error.message)
      return null
    }

    return data ? hydrateSeries(data, true) : null
  } catch (error) {
    console.error('getSeriesBySlug failed:', error)
    return null
  }
}

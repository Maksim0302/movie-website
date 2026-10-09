import { getCloudflareHlsUrl } from './cloudflare'
import { getSupabaseServerClient } from './supabase'
import { getImageUrl, getSeriesByTmdbId } from './tmdb'

async function hydrateSeries(series) {
  try {
    const metadata = await getSeriesByTmdbId(series.tmdb_id)

    if (!metadata) {
      return null
    }

    return {
      ...series,
      ...metadata,
      poster: getImageUrl(metadata.poster_path),
      backdrop: getImageUrl(metadata.backdrop_path, 'w1280'),
      videoUrl: getCloudflareHlsUrl(series.video_id),
    }
  } catch (error) {
    console.error('Failed to hydrate series:', error)
    return null
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

    return data ? hydrateSeries(data) : null
  } catch (error) {
    console.error('getSeriesBySlug failed:', error)
    return null
  }
}

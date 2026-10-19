import { NextResponse } from 'next/server'

import {
  getSeriesByTmdbId,
  getSeriesEpisodeMetadata,
} from '@/lib/tmdb'
import { getSupabaseServerClient } from '@/lib/supabase'

function normalizeSlug(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeOptionalUrl(value) {
  return typeof value === 'string' ? value.trim() || null : null
}

function normalizeEpisodes(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((episode) => episode && typeof episode === 'object')
    .map((episode) => ({
      seasonNumber: Number(episode.seasonNumber),
      episodeNumber: Number(episode.episodeNumber),
      durationMinutes:
        Number.isInteger(Number(episode.durationMinutes)) &&
        Number(episode.durationMinutes) > 0
          ? Number(episode.durationMinutes)
          : null,
      videoPath:
        typeof episode.videoPath === 'string' ? episode.videoPath.trim() : '',
    }))
    .filter(
      (episode) =>
        Number.isInteger(episode.seasonNumber) &&
        episode.seasonNumber > 0 &&
        Number.isInteger(episode.episodeNumber) &&
        episode.episodeNumber > 0 &&
        episode.videoPath
    )
}

async function saveEpisodes(supabase, seriesId, episodes) {
  const seasonNumbers = [
    ...new Set(episodes.map(({ seasonNumber }) => seasonNumber)),
  ]
  const seasonRows = seasonNumbers.map((seasonNumber) => ({
    series_id: seriesId,
    season_number: seasonNumber,
  }))

  if (seasonRows.length === 0) {
    return null
  }

  const { data: seasons, error: seasonsError } = await supabase
    .from('series_seasons')
    .upsert(seasonRows, { onConflict: 'series_id,season_number' })
    .select('id, season_number')

  if (seasonsError) {
    return seasonsError
  }

  const seasonIds = new Map(
    (seasons || []).map((season) => [season.season_number, season.id])
  )
  const episodeRows = episodes.map((episode) => ({
    season_id: seasonIds.get(episode.seasonNumber),
    episode_number: episode.episodeNumber,
    duration_minutes: episode.durationMinutes,
    video_path: episode.videoPath,
  }))

  const { error: episodesError } = await supabase
    .from('series_episodes')
    .upsert(episodeRows, { onConflict: 'season_id,episode_number' })

  return episodesError || null
}

async function parseBody(request) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return request.json().catch(() => ({}))
  }

  return request.formData().then((formData) => {
    const result = {}

    for (const [key, value] of formData.entries()) {
      result[key] = value
    }

    return result
  })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const seriesId = Number(searchParams.get('seriesId'))
  const tmdbId = Number(searchParams.get('tmdbId'))

  if (Number.isInteger(seriesId) && seriesId > 0) {
    const supabase = getSupabaseServerClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase не настроен. Проверьте переменные окружения.' },
        { status: 500 }
      )
    }

    const { data: seasons, error: seasonsError } = await supabase
      .from('series_seasons')
      .select('id, season_number')
      .eq('series_id', seriesId)
      .order('season_number', { ascending: true })

    if (seasonsError) {
      return NextResponse.json({ error: seasonsError.message }, { status: 500 })
    }

    const seasonIds = (seasons || []).map((season) => season.id)
    const { data: episodes, error: episodesError } = seasonIds.length
      ? await supabase
          .from('series_episodes')
          .select('season_id, episode_number, duration_minutes, video_path')
          .in('season_id', seasonIds)
          .order('episode_number', { ascending: true })
      : { data: [], error: null }

    if (episodesError) {
      return NextResponse.json({ error: episodesError.message }, { status: 500 })
    }

    return NextResponse.json(
      (seasons || []).map((season) => ({
        seasonNumber: season.season_number,
        episodes: (episodes || [])
          .filter((episode) => episode.season_id === season.id)
          .map((episode) => ({
            episodeNumber: episode.episode_number,
            durationMinutes: episode.duration_minutes,
            videoPath: episode.video_path,
          })),
      }))
    )
  }

  if (Number.isFinite(tmdbId) && tmdbId > 0) {
    try {
      const seasons = await getSeriesEpisodeMetadata(tmdbId)

      if (!seasons) {
        return NextResponse.json(
          { error: 'Не удалось получить данные сезонов из TMDB.' },
          { status: 503 }
        )
      }

      return NextResponse.json(seasons)
    } catch (error) {
      console.error('TMDB get series episodes error:', error)
      return NextResponse.json(
        { error: 'Не удалось получить данные сезонов из TMDB.' },
        { status: 502 }
      )
    }
  }

  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase не настроен. Проверьте переменные окружения.' },
      { status: 500 }
    )
  }

  const { data, error } = await supabase
    .from('series')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message || 'Не удалось получить сериалы.' },
      { status: 500 }
    )
  }

  return NextResponse.json(data || [])
}

export async function POST(request) {
  try {
    const body = await parseBody(request)
    const methodOverride = body._method || body.method

    if (String(methodOverride).toUpperCase() === 'DELETE') {
      return DELETE(request)
    }

    const tmdbId = Number(body.tmdbId)
    const slug = normalizeSlug(String(body.slug || ''))
    const videoId =
      typeof body.videoId === 'string'
        ? body.videoId.trim()
        : String(body.videoId || '').trim()
    const episodes = normalizeEpisodes(body.episodes)
    const youtubeUrl = normalizeOptionalUrl(body.youtubeUrl)
    const telegramUrl = normalizeOptionalUrl(body.telegramUrl)

    if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
      return NextResponse.json(
        { error: 'TMDB ID обязателен и должен быть положительным числом.' },
        { status: 400 }
      )
    }

    if (!slug) {
      return NextResponse.json({ error: 'Slug обязателен.' }, { status: 400 })
    }

    if (!videoId && episodes.length === 0) {
      return NextResponse.json(
        { error: 'Укажите ID видео сериала или хотя бы одной серии.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase не настроен. Проверьте переменные окружения.' },
        { status: 500 }
      )
    }

    const { data: existingTmdbSeries } = await supabase
      .from('series')
      .select('id')
      .eq('tmdb_id', tmdbId)
      .maybeSingle()

    if (existingTmdbSeries) {
      return NextResponse.json(
        { error: 'Сериал с таким TMDB ID уже существует.' },
        { status: 409 }
      )
    }

    const { data: existingSlugSeries } = await supabase
      .from('series')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingSlugSeries) {
      return NextResponse.json(
        { error: 'Сериал с таким slug уже существует.' },
        { status: 409 }
      )
    }

    const metadata = await getSeriesByTmdbId(tmdbId)

    if (!metadata) {
      return NextResponse.json(
        { error: 'Сериал с таким TMDB ID не найден.' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('series')
      .insert({
        tmdb_id: tmdbId,
        slug,
        video_id: videoId || null,
        youtube_url: youtubeUrl,
        telegram_url: telegramUrl,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Не удалось создать сериал.' },
        { status: 500 }
      )
    }

    const episodeSaveError = await saveEpisodes(supabase, data.id, episodes)

    if (episodeSaveError) {
      console.error('Supabase save series episodes error:', episodeSaveError)
      return NextResponse.json(
        { error: episodeSaveError.message || 'Не удалось сохранить серии.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Сериал успешно добавлен.',
      series: data,
      metadata,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Не удалось добавить сериал.',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const body = await parseBody(request)
    const id = Number(body.id)
    const tmdbId = Number(body.tmdbId)
    const slug = normalizeSlug(String(body.slug || ''))
    const videoId =
      typeof body.videoId === 'string'
        ? body.videoId.trim()
        : String(body.videoId || '').trim()
    const episodes = normalizeEpisodes(body.episodes)
    const youtubeUrl = normalizeOptionalUrl(body.youtubeUrl)
    const telegramUrl = normalizeOptionalUrl(body.telegramUrl)

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: 'Не указан сериал для редактирования.' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
      return NextResponse.json(
        { error: 'TMDB ID обязателен и должен быть положительным числом.' },
        { status: 400 }
      )
    }

    if (!slug) {
      return NextResponse.json({ error: 'Slug обязателен.' }, { status: 400 })
    }

    if (!videoId && episodes.length === 0) {
      return NextResponse.json(
        { error: 'Укажите ID видео сериала или хотя бы одной серии.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase не настроен. Проверьте переменные окружения.' },
        { status: 500 }
      )
    }

    const { data: existingSeries, error: existingSeriesError } = await supabase
      .from('series')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (existingSeriesError) {
      return NextResponse.json(
        { error: existingSeriesError.message },
        { status: 500 }
      )
    }

    if (!existingSeries) {
      return NextResponse.json(
        { error: 'Сериал для редактирования не найден.' },
        { status: 404 }
      )
    }

    const { data: conflictingTmdbSeries, error: tmdbConflictError } =
      await supabase
        .from('series')
        .select('id')
        .eq('tmdb_id', tmdbId)
        .neq('id', id)
        .maybeSingle()

    if (tmdbConflictError) {
      return NextResponse.json(
        { error: tmdbConflictError.message },
        { status: 500 }
      )
    }

    if (conflictingTmdbSeries) {
      return NextResponse.json(
        { error: 'Сериал с таким TMDB ID уже существует.' },
        { status: 409 }
      )
    }

    const { data: conflictingSlugSeries, error: slugConflictError } =
      await supabase
        .from('series')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .maybeSingle()

    if (slugConflictError) {
      return NextResponse.json(
        { error: slugConflictError.message },
        { status: 500 }
      )
    }

    if (conflictingSlugSeries) {
      return NextResponse.json(
        { error: 'Сериал с таким slug уже существует.' },
        { status: 409 }
      )
    }

    const metadata = await getSeriesByTmdbId(tmdbId)

    if (!metadata) {
      return NextResponse.json(
        { error: 'Сериал с таким TMDB ID не найден.' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('series')
      .update({
        tmdb_id: tmdbId,
        slug,
        video_id: videoId || null,
        youtube_url: youtubeUrl,
        telegram_url: telegramUrl,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Не удалось обновить сериал.' },
        { status: 500 }
      )
    }

    const episodeSaveError = await saveEpisodes(supabase, id, episodes)

    if (episodeSaveError) {
      console.error('Supabase save series episodes error:', episodeSaveError)
      return NextResponse.json(
        { error: episodeSaveError.message || 'Не удалось сохранить серии.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Сериал успешно обновлён.',
      series: data,
      metadata,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Не удалось обновить сериал.',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const body = await parseBody(request)
    const slug = normalizeSlug(String(body.slug || ''))
    const id = Number(body.id)

    if (!slug && !Number.isFinite(id)) {
      return NextResponse.json(
        { error: 'Не указан сериал для удаления.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase не настроен.' },
        { status: 500 }
      )
    }

    let query = supabase.from('series').delete()

    if (slug) {
      query = query.eq('slug', slug)
    } else {
      query = query.eq('id', id)
    }

    const { error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Не удалось удалить сериал.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Сериал удалён из каталога.' })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Не удалось удалить сериал.',
      },
      { status: 500 }
    )
  }
}

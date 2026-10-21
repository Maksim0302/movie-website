import { NextResponse } from 'next/server'

import { getMovieAvailabilityStatus } from '@/lib/movie-availability'
import { getVideoUrl } from '@/lib/cloudflare'
import { getMovie, getSeriesByTmdbId } from '@/lib/tmdb'
import { getSupabaseServerClient } from '@/lib/supabase'

const METADATA_CONCURRENCY = 8
const CATALOG_PAGE_SIZE = 500

function normalizeText(value) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('ru-RU')
    .trim()
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

async function searchCatalog(supabase, table, type) {
  const catalog = []
  let offset = 0
  const select =
    type === 'movie'
      ? 'id, tmdb_id, slug, created_at, video_id, trailer_video_id'
      : 'id, tmdb_id, slug, created_at, video_id, youtube_url, telegram_url'

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .order('created_at', { ascending: false })
      .range(offset, offset + CATALOG_PAGE_SIZE - 1)

    if (error) {
      throw new Error(`Не удалось получить каталог ${table}: ${error.message}`)
    }

    catalog.push(...(data || []))

    if (!data || data.length < CATALOG_PAGE_SIZE) {
      break
    }

    offset += CATALOG_PAGE_SIZE
  }

  return catalog.map((item) => ({ ...item, type }))
}

async function addSeriesAvailability(supabase, series) {
  if (series.length === 0) {
    return new Map()
  }

  const { data: seasons, error: seasonsError } = await supabase
    .from('series_seasons')
    .select('id, series_id')
    .in(
      'series_id',
      series.map((item) => item.id)
    )

  if (seasonsError) {
    throw new Error(`Не удалось получить сезоны сериалов: ${seasonsError.message}`)
  }

  const seasonIds = (seasons || []).map((season) => season.id)
  const { data: episodes, error: episodesError } = seasonIds.length
    ? await supabase
        .from('series_episodes')
        .select('season_id, video_path')
        .in('season_id', seasonIds)
    : { data: [], error: null }

  if (episodesError) {
    throw new Error(`Не удалось получить серии сериалов: ${episodesError.message}`)
  }

  const seriesWithEpisodes = new Set()
  const seriesBySeasonId = new Map(
    (seasons || []).map((season) => [season.id, season.series_id])
  )

  for (const episode of episodes || []) {
    if (getVideoUrl(episode.video_path)) {
      seriesWithEpisodes.add(seriesBySeasonId.get(episode.season_id))
    }
  }

  return new Map(
    series.map((item) => [
      item.id,
      {
        series_has_episodes:
          seriesWithEpisodes.has(item.id) ||
          Boolean(item.youtube_url?.trim()) ||
          Boolean(item.telegram_url?.trim()),
        series_has_trailer: Boolean(getVideoUrl(item.video_id)),
      },
    ])
  )
}

export async function GET(request) {
  const query = request.nextUrl.searchParams.get('q')?.trim() || ''

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase не настроен. Проверьте переменные окружения.' },
      { status: 500 }
    )
  }

  try {
    const [movies, series] = await Promise.all([
      searchCatalog(supabase, 'movies', 'movie'),
      searchCatalog(supabase, 'series', 'series'),
    ])
    const seriesAvailability = await addSeriesAvailability(supabase, series)
    const catalog = [
      ...movies.map((item) => ({
        ...item,
        availability_status: getMovieAvailabilityStatus(item),
      })),
      ...series.map((item) => ({
        ...item,
        ...seriesAvailability.get(item.id),
      })),
    ]
    const normalizedQuery = normalizeText(query)

    const matches = await mapWithConcurrency(
      catalog,
      METADATA_CONCURRENCY,
      async (item) => {
        const metadata =
          item.type === 'movie'
            ? await getMovie(item.tmdb_id)
            : await getSeriesByTmdbId(item.tmdb_id)

        if (!metadata?.title) {
          return null
        }

        const title = normalizeText(metadata.title)
        const originalTitle = normalizeText(metadata.original_title || '')

        if (
          !title.includes(normalizedQuery) &&
          !originalTitle.includes(normalizedQuery)
        ) {
          return null
        }

        return {
          type: item.type,
          id: item.id,
          tmdb_id: item.tmdb_id,
          slug: item.slug,
          title: metadata.title,
          original_title: metadata.original_title,
          overview: metadata.overview,
          release_date: metadata.release_date,
          poster_path: metadata.poster_path,
          vote_average: metadata.vote_average,
          availability_status: item.availability_status,
          series_has_episodes: item.series_has_episodes,
          series_has_trailer: item.series_has_trailer,
        }
      }
    )

    const results = matches
      .filter(Boolean)
      .sort((left, right) => {
        const leftTitle = normalizeText(left.title)
        const rightTitle = normalizeText(right.title)
        const leftStartsWithQuery = leftTitle.startsWith(normalizedQuery)
        const rightStartsWithQuery = rightTitle.startsWith(normalizedQuery)

        if (leftStartsWithQuery !== rightStartsWithQuery) {
          return leftStartsWithQuery ? -1 : 1
        }
        return 0
      })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search API failed:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Не удалось выполнить поиск.',
      },
      { status: 500 }
    )
  }
}

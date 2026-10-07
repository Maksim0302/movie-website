import { NextResponse } from 'next/server'

import { getMovie, getSeriesByTmdbId } from '@/lib/tmdb'
import { getSupabaseServerClient } from '@/lib/supabase'

const MAX_RESULTS = 12
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

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('id, tmdb_id, slug, created_at')
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
    const catalog = [...movies, ...series]
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
      .slice(0, MAX_RESULTS)

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

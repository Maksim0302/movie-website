import { NextResponse } from 'next/server'

import { getSeriesByTmdbId } from '@/lib/tmdb'
import { getSupabaseServerClient } from '@/lib/supabase'

function normalizeSlug(value) {
  return typeof value === 'string' ? value.trim() : ''
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

export async function GET() {
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

    if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
      return NextResponse.json(
        { error: 'TMDB ID обязателен и должен быть положительным числом.' },
        { status: 400 }
      )
    }

    if (!slug) {
      return NextResponse.json({ error: 'Slug обязателен.' }, { status: 400 })
    }

    if (!videoId) {
      return NextResponse.json(
        { error: 'Cloudflare Video ID обязателен.' },
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
        video_id: videoId,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Не удалось создать сериал.' },
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

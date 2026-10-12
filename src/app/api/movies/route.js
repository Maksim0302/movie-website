import { NextResponse } from 'next/server'

import { getMovieAvailabilityStatus } from '@/lib/movie-availability'
import { getMovie } from '@/lib/tmdb'
import { getSupabaseServerClient } from '@/lib/supabase'

function normalizeSlug(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeVideoId(value) {
  return typeof value === 'string' ? value.trim() || null : null
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
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message || 'Не удалось получить фильмы.' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    (data || []).map((movie) => ({
      ...movie,
      availability_status: getMovieAvailabilityStatus(movie),
    }))
  )
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
    const videoId = normalizeVideoId(body.videoId)
    const trailerVideoId = normalizeVideoId(body.trailerVideoId)

    if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
      return NextResponse.json(
        { error: 'TMDB ID обязателен и должен быть положительным числом.' },
        { status: 400 }
      )
    }

    if (!slug) {
      return NextResponse.json({ error: 'Slug обязателен.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase не настроен. Проверьте переменные окружения.' },
        { status: 500 }
      )
    }

    const { data: existingTmdbMovie } = await supabase
      .from('movies')
      .select('id')
      .eq('tmdb_id', tmdbId)
      .maybeSingle()

    if (existingTmdbMovie) {
      return NextResponse.json(
        { error: 'Фильм с таким TMDB ID уже существует.' },
        { status: 409 }
      )
    }

    const { data: existingSlugMovie } = await supabase
      .from('movies')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existingSlugMovie) {
      return NextResponse.json(
        { error: 'Фильм с таким slug уже существует.' },
        { status: 409 }
      )
    }

    const metadata = await getMovie(tmdbId)

    if (!metadata) {
      return NextResponse.json(
        { error: 'Фильм с таким TMDB ID не найден.' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('movies')
      .insert({
        tmdb_id: tmdbId,
        slug,
        video_id: videoId,
        trailer_video_id: trailerVideoId,
        availability_status: getMovieAvailabilityStatus({
          video_id: videoId,
          trailer_video_id: trailerVideoId,
        }),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Не удалось создать фильм.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Фильм успешно добавлен.',
      movie: data,
      metadata,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Не удалось добавить фильм.',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const body = await parseBody(request)
    const id = Number(body.id)
    const videoId = normalizeVideoId(body.videoId)
    const trailerVideoId = normalizeVideoId(body.trailerVideoId)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: 'Не указан корректный ID фильма.' },
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

    const { data, error } = await supabase
      .from('movies')
      .update({
        video_id: videoId,
        trailer_video_id: trailerVideoId,
        availability_status: getMovieAvailabilityStatus({
          video_id: videoId,
          trailer_video_id: trailerVideoId,
        }),
      })
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Не удалось обновить фильм.' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Фильм не найден.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Данные фильма обновлены.', movie: data })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Не удалось обновить фильм.',
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
        { error: 'Не указан фильм для удаления.' },
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

    let query = supabase.from('movies').delete()

    if (slug) {
      query = query.eq('slug', slug)
    } else {
      query = query.eq('id', id)
    }

    const { error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Не удалось удалить фильм.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Фильм удалён из каталога.' })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Не удалось удалить фильм.',
      },
      { status: 500 }
    )
  }
}

const TMDB_API_URL = 'https://api.themoviedb.org/3'

function getTmdbHeaders() {
  const token = process.env.TMDB_TOKEN

  if (!token) {
    return null
  }

  return {
    Authorization: `Bearer ${token}`,
    accept: 'application/json',
  }
}

export async function getPopularMovies() {
  const headers = getTmdbHeaders()

  if (!headers) {
    return { results: [] }
  }

  const response = await fetch(
    `${TMDB_API_URL}/movie/popular?language=ru-RU&page=1`,
    {
      headers,
      next: {
        revalidate: 3600,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Не удалось получить популярные фильмы')
  }

  return response.json()
}

export async function getPopularSeries() {
  const headers = getTmdbHeaders()

  if (!headers) {
    return { results: [] }
  }

  const response = await fetch(
    `${TMDB_API_URL}/tv/popular?language=ru-RU&page=1`,
    {
      headers,
      next: {
        revalidate: 3600,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Не удалось получить популярные сериалы')
  }

  return response.json()
}

export async function getMovie(tmdbId) {
  if (!tmdbId) {
    return null
  }

  const headers = getTmdbHeaders()

  if (!headers) {
    return null
  }

  const response = await fetch(
    `${TMDB_API_URL}/movie/${tmdbId}?language=ru-RU`,
    {
      headers,
      next: {
        revalidate: 3600,
      },
    }
  )

  if (!response.ok) {
    return null
  }

  const data = await response.json()

  return {
    id: data.id,
    title: data.title || data.original_title,
    original_title: data.original_title,
    overview: data.overview || 'Описание отсутствует.',
    poster_path: data.poster_path,
    backdrop_path: data.backdrop_path,
    release_date: data.release_date,
    vote_average: data.vote_average ?? 0,
    genres: Array.isArray(data.genres)
      ? data.genres.map((genre) => genre.name)
      : [],
    runtime: data.runtime ?? 0,
  }
}

export function getImageUrl(path, size = 'w500') {
  if (!path) {
    return '/img/no-poster.jpg'
  }

  return `https://image.tmdb.org/t/p/${size}${path}`
}

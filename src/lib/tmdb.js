const TMDB_API_URL = 'https://api.themoviedb.org/3'

const headers = {
  Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
  accept: 'application/json',
}

export async function getPopularMovies() {
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

export function getImageUrl(path, size = 'w500') {
  if (!path) {
    return '/img/no-poster.jpg'
  }

  return `https://image.tmdb.org/t/p/${size}${path}`
}

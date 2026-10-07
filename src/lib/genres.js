export const genres = [
  { slug: 'action', id: 28, name: 'Боевики' },
  { slug: 'drama', id: 18, name: 'Драмы' },
  { slug: 'comedy', id: 35, name: 'Комедии' },
  { slug: 'horror', id: 27, name: 'Ужасы' },
  { slug: 'science-fiction', id: 878, name: 'Фантастика' },
  { slug: 'animation', id: 16, name: 'Мультфильмы' },
]

export function getGenreBySlug(slug) {
  return genres.find((genre) => genre.slug === slug) || null
}

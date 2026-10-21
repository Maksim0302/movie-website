export const genres = [
  { slug: 'action', id: 28, seriesId: 10759, name: 'Боевики' },
  { slug: 'drama', id: 18, seriesId: 18, name: 'Драмы' },
  { slug: 'comedy', id: 35, seriesId: 35, name: 'Комедии' },
  { slug: 'horror', id: 27, seriesId: 27, name: 'Ужасы' },
  { slug: 'science-fiction', id: 878, seriesId: 10765, name: 'Фантастика' },
  { slug: 'animation', id: 16, seriesId: 16, name: 'Мультфильмы' },
]

export function getGenreBySlug(slug) {
  return genres.find((genre) => genre.slug === slug) || null
}

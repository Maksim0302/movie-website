export const MOVIE_SORT_OPTIONS = [
  {
    id: 'created-desc',
    criterion: 'Дата добавления',
    displayCriterion: 'По дате добавления',
    direction: '↓',
    description: 'Сначала новые, затем старые',
    field: 'created_at',
    multiplier: -1,
  },
  {
    id: 'created-asc',
    criterion: 'Дата добавления',
    displayCriterion: 'По дате добавления',
    direction: '↑',
    description: 'Сначала старые, затем новые',
    field: 'created_at',
    multiplier: 1,
  },
  {
    id: 'year-desc',
    criterion: 'Год выпуска',
    displayCriterion: 'По году выпуска',
    direction: '↓',
    description: 'От новых фильмов к старым',
    field: 'release_date',
    multiplier: -1,
  },
  {
    id: 'year-asc',
    criterion: 'Год выпуска',
    displayCriterion: 'По году выпуска',
    direction: '↑',
    description: 'От старых фильмов к новым',
    field: 'release_date',
    multiplier: 1,
  },
  {
    id: 'popularity-desc',
    criterion: 'Популярность',
    displayCriterion: 'По популярности',
    direction: '↓',
    description: 'От популярных к непопулярным',
    field: 'vote_average',
    multiplier: -1,
  },
  {
    id: 'popularity-asc',
    criterion: 'Популярность',
    displayCriterion: 'По популярности',
    direction: '↑',
    description: 'От непопулярных к популярным',
    field: 'vote_average',
    multiplier: 1,
  },
  {
    id: 'title-asc',
    criterion: 'По алфавиту',
    displayCriterion: 'По алфавиту',
    direction: '↑',
    description: 'От А до Я',
    field: 'title',
    multiplier: 1,
  },
  {
    id: 'title-desc',
    criterion: 'По алфавиту',
    displayCriterion: 'По алфавиту',
    direction: '↓',
    description: 'От Я до А',
    field: 'title',
    multiplier: -1,
  },
]

const DEFAULT_SORT = MOVIE_SORT_OPTIONS[0]
const SORTS_BY_ID = new Map(
  MOVIE_SORT_OPTIONS.map((option) => [option.id, option])
)
const titleCollator = new Intl.Collator('ru-RU', {
  numeric: true,
  sensitivity: 'base',
})

export function getMovieSort(sortId) {
  return SORTS_BY_ID.get(sortId) || DEFAULT_SORT
}

function getReleaseYear(releaseDate) {
  const year = Number.parseInt(
    typeof releaseDate === 'string' ? releaseDate.slice(0, 4) : '',
    10
  )
  return Number.isFinite(year) ? year : 0
}

function getTimestamp(value) {
  const timestamp = new Date(value || 0).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

export function sortMovies(movies = [], sortId) {
  const option = getMovieSort(sortId)

  return [...movies].sort((first, second) => {
    let comparison = 0

    if (option.field === 'created_at') {
      comparison = getTimestamp(first.created_at) - getTimestamp(second.created_at)
    } else if (option.field === 'release_date') {
      comparison =
        getReleaseYear(first.release_date) -
        getReleaseYear(second.release_date)
    } else if (option.field === 'vote_average') {
      comparison =
        Number(first.vote_average || 0) - Number(second.vote_average || 0)
    } else {
      comparison = titleCollator.compare(
        first.title || first.original_title || '',
        second.title || second.original_title || ''
      )
    }

    return comparison * option.multiplier
  })
}

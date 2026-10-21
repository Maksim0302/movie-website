'use client'

import { useEffect, useState } from 'react'

import MovieCatalog from '@/components/MovieCatalog/MovieCatalog'

export default function SearchResults({ query }) {
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(query))
  const [error, setError] = useState('')

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsLoading(false)
      setError('')
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError('')

    fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Не удалось выполнить поиск.')
        }

        return data.results || []
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setResults(data)
        }
      })
      .catch((searchError) => {
        if (searchError.name !== 'AbortError') {
          console.error('Search results request failed:', searchError)
          setResults([])
          setError('Не удалось выполнить поиск. Попробуйте ещё раз.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [query])

  const emptyMessage =
    query.length < 2
      ? 'Введите не менее двух символов для поиска.'
      : isLoading
        ? 'Поиск фильмов и сериалов...'
        : error || 'Ничего не найдено.'

  return (
    <MovieCatalog
      movies={results}
      searchQuery={query}
      title="Результаты поиска"
      emptyMessage={emptyMessage}
      clearSearchHref="/search"
    />
  )
}

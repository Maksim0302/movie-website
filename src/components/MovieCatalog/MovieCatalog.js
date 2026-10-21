'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

import MovieGrid from '@/components/MovieGrid/MovieGrid'
import {
  getMovieSort,
  MOVIE_SORT_OPTIONS,
  sortMovies,
} from '@/lib/movie-sorting'
import styles from './MovieCatalog.module.scss'

const PAGE_SIZE = 10

function getPageNumbers(currentPage, totalPages) {
  const pages = new Set([1, totalPages])

  for (
    let page = Math.max(1, currentPage - 1);
    page <= Math.min(totalPages, currentPage + 1);
    page += 1
  ) {
    pages.add(page)
  }

  return [...pages].sort((first, second) => first - second)
}

export default function MovieCatalog({
  movies = [],
  initialPage = 1,
  initialSort = 'created-desc',
  searchQuery = '',
  emptyMessage = 'В каталоге пока нет фильмов.',
  title = 'Фильмы',
  entityName = 'фильмов',
  hrefPrefix = 'movies',
  clearSearchHref = '/movies',
}) {
  const [currentSort, setCurrentSort] = useState(
    () => getMovieSort(initialSort).id
  )
  const [isSortDialogOpen, setIsSortDialogOpen] = useState(false)
  const previousInitialSort = useRef(initialSort)
  const sortedMovies = useMemo(
    () => sortMovies(movies, currentSort),
    [currentSort, movies]
  )
  const totalPages = Math.ceil(sortedMovies.length / PAGE_SIZE)
  const [currentPage, setCurrentPage] = useState(() =>
    Math.min(Math.max(initialPage, 1), Math.max(totalPages, 1))
  )
  const listRef = useRef(null)
  const initialUrlSynced = useRef(false)
  const previousSearchQuery = useRef(searchQuery)
  const visibleMovies = sortedMovies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )
  const activeSort = getMovieSort(currentSort)

  const scrollToList = useCallback(() => {
    if (!listRef.current) {
      return
    }

    const listTop = listRef.current.getBoundingClientRect().top + window.scrollY
    window.scrollTo({
      top: Math.max(0, listTop - 150),
      behavior: 'smooth',
    })
  }, [])

  const setPageInUrl = useCallback((page, method = 'pushState') => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', String(page))
    window.history[method]({}, '', `${url.pathname}${url.search}${url.hash}`)
  }, [])

  const changeSort = useCallback((sortId) => {
    const nextSort = getMovieSort(sortId)
    const url = new URL(window.location.href)
    url.searchParams.set('sort', nextSort.id)
    url.searchParams.set('page', '1')
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`)
    setCurrentSort(nextSort.id)
    setCurrentPage(1)
    setIsSortDialogOpen(false)
  }, [])

  useEffect(() => {
    if (initialUrlSynced.current) {
      return
    }

    initialUrlSynced.current = true
    const urlPage = Number.parseInt(
      new URL(window.location.href).searchParams.get('page'),
      10
    )
    const normalizedUrlPage =
      Number.isInteger(urlPage) && urlPage > 0 ? urlPage : 1

    if (normalizedUrlPage !== currentPage) {
      setPageInUrl(currentPage, 'replaceState')
    }
  }, [currentPage, setPageInUrl])

  useEffect(() => {
    if (previousSearchQuery.current !== searchQuery) {
      previousSearchQuery.current = searchQuery
      setCurrentPage(1)
    }
  }, [searchQuery])

  useEffect(() => {
    if (previousInitialSort.current !== initialSort) {
      previousInitialSort.current = initialSort
      setCurrentSort(getMovieSort(initialSort).id)
      setCurrentPage(1)
    }
  }, [initialSort])

  useEffect(() => {
    if (!isSortDialogOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsSortDialogOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSortDialogOpen])

  useEffect(() => {
    function handlePopState() {
      const url = new URL(window.location.href)
      const urlPage = Number.parseInt(url.searchParams.get('page'), 10)
      const requestedPage =
        Number.isInteger(urlPage) && urlPage > 0 ? urlPage : 1
      const nextPage = Math.min(requestedPage, Math.max(totalPages, 1))
      const nextSort = getMovieSort(url.searchParams.get('sort')).id

      if (nextPage !== currentPage) {
        setCurrentPage(nextPage)
        window.requestAnimationFrame(scrollToList)
      }

      if (nextSort !== currentSort) {
        setCurrentSort(nextSort)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [currentPage, currentSort, scrollToList, totalPages])

  function changePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) {
      return
    }

    setPageInUrl(page)
    setCurrentPage(page)
    window.requestAnimationFrame(scrollToList)
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <>
      <div className={styles.catalogHeader}>
        <h1 className={styles.catalogTitle}>{title}</h1>
        <button
          type="button"
          className={styles.sortTrigger}
          onClick={() => setIsSortDialogOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isSortDialogOpen}
        >
          <span>Сортировка: {activeSort.displayCriterion}</span>
          <span className={styles.sortDirection} aria-hidden="true">
            {activeSort.direction}
          </span>
        </button>
      </div>

      {isSortDialogOpen ? (
        <div
          className={styles.dialogBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsSortDialogOpen(false)
            }
          }}
        >
          <section
            className={styles.sortDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="movie-sort-title"
          >
            <div className={styles.dialogHeader}>
              <h2 id="movie-sort-title" className={styles.dialogTitle}>
                Сортировка {entityName}
              </h2>
              <button
                type="button"
                className={styles.closeDialog}
                onClick={() => setIsSortDialogOpen(false)}
                aria-label="Закрыть окно сортировки"
              >
                ×
              </button>
            </div>

            <div className={styles.sortGroups}>
              {[
                'Дата добавления',
                'Год выпуска',
                'Популярность',
                'По алфавиту',
              ].map((criterion) => (
                <section className={styles.sortGroup} key={criterion}>
                  <h3 className={styles.sortCriterion}>{criterion}</h3>
                  <div className={styles.sortOptions}>
                    {MOVIE_SORT_OPTIONS.filter(
                      (option) => option.criterion === criterion
                    ).map((option) => (
                      <button
                        type="button"
                        key={option.id}
                        className={`${styles.sortOption} ${
                          currentSort === option.id ? styles.selectedSort : ''
                        }`}
                        onClick={() => changeSort(option.id)}
                        aria-pressed={currentSort === option.id}
                      >
                        <span
                          className={styles.optionDirection}
                          aria-hidden="true"
                        >
                          {option.direction}
                        </span>
                        <span>
                          {option.description.replace('фильмов', entityName)}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {searchQuery ? (
        <div className={styles.searchSummary}>
          <span>Результаты поиска: «{searchQuery}»</span>
          <Link href={clearSearchHref} className={styles.clearSearch}>
            Очистить поиск
          </Link>
        </div>
      ) : null}

      <div ref={listRef}>
        {movies.length ? (
          <MovieGrid movies={visibleMovies} hrefPrefix={hrefPrefix} />
        ) : searchQuery ? (
          <div className={styles.emptySearch}>
            <p>По вашему запросу ничего не найдено</p>
          </div>
        ) : (
          <MovieGrid
            movies={visibleMovies}
            hrefPrefix={hrefPrefix}
            emptyMessage={emptyMessage}
          />
        )}
      </div>

      {totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="Страницы каталога">
          <button
            type="button"
            className={styles.direction}
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Назад
          </button>

          <div className={styles.pages}>
            {pageNumbers.map((page, index) => {
              const previousPage = pageNumbers[index - 1]
              const hasGap = previousPage && page - previousPage > 1
              const hideOnMobile =
                (page === 1 && currentPage > 2) ||
                (page === totalPages && currentPage < totalPages - 1)

              return (
                <span
                  className={`${styles.pageItem} ${
                    hideOnMobile ? styles.mobileHidden : ''
                  }`}
                  key={page}
                >
                  {hasGap ? (
                    <span className={styles.ellipsis} aria-hidden="true">
                      …
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={`${styles.page} ${
                      currentPage === page ? styles.activePage : ''
                    }`}
                    onClick={() => changePage(page)}
                    aria-label={`Страница ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                </span>
              )
            })}
          </div>

          <button
            type="button"
            className={styles.direction}
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Вперёд
          </button>
        </nav>
      ) : null}
    </>
  )
}

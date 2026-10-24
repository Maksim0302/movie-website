'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageParam = searchParams.get('page')
  const requestedPage = Number.parseInt(pageParam ?? String(initialPage), 10)
  const currentSort = getMovieSort(
    searchParams.get('sort') || initialSort
  ).id
  const [isSortDialogOpen, setIsSortDialogOpen] = useState(false)
  const sortedMovies = useMemo(
    () => sortMovies(movies, currentSort),
    [currentSort, movies]
  )
  const totalPages = Math.ceil(sortedMovies.length / PAGE_SIZE)
  const normalizedRequestedPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const currentPage = Math.min(
    Math.max(normalizedRequestedPage, 1),
    Math.max(totalPages, 1)
  )
  const listRef = useRef(null)
  const previousPage = useRef(currentPage)
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

  const navigateWithQuery = useCallback((update, method = 'push') => {
    const url = new URL(window.location.href)
    update(url.searchParams)
    router[method](`${url.pathname}${url.search}${url.hash}`, {
      scroll: false,
    })
  }, [router])

  const changeSort = useCallback((sortId) => {
    const nextSort = getMovieSort(sortId)
    navigateWithQuery((params) => {
      params.set('sort', nextSort.id)
      params.set('page', '1')
    })
    setIsSortDialogOpen(false)
  }, [navigateWithQuery])

  useEffect(() => {
    if (pageParam !== null && String(currentPage) !== pageParam) {
      navigateWithQuery(
        (params) => params.set('page', String(currentPage)),
        'replace'
      )
    }
  }, [currentPage, navigateWithQuery, searchParams])

  useEffect(() => {
    if (previousPage.current !== currentPage) {
      previousPage.current = currentPage
      window.requestAnimationFrame(scrollToList)
    }
  }, [currentPage, scrollToList])

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

  function changePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) {
      return
    }

    navigateWithQuery((params) => params.set('page', String(page)))
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

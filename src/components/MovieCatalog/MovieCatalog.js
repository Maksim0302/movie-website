'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

import MovieGrid from '@/components/MovieGrid/MovieGrid'
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
  searchQuery = '',
  emptyMessage = 'В каталоге пока нет фильмов.',
}) {
  const totalPages = Math.ceil(movies.length / PAGE_SIZE)
  const [currentPage, setCurrentPage] = useState(() =>
    Math.min(Math.max(initialPage, 1), Math.max(totalPages, 1))
  )
  const listRef = useRef(null)
  const initialUrlSynced = useRef(false)
  const previousSearchQuery = useRef(searchQuery)
  const visibleMovies = movies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const scrollToList = useCallback(() => {
    if (!listRef.current) {
      return
    }

    const listTop = listRef.current.getBoundingClientRect().top + window.scrollY
    window.scrollTo({
      top: Math.max(0, listTop - 110),
      behavior: 'smooth',
    })
  }, [])

  const setPageInUrl = useCallback((page, method = 'pushState') => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', String(page))
    window.history[method]({}, '', `${url.pathname}${url.search}${url.hash}`)
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
    function handlePopState() {
      const urlPage = Number.parseInt(
        new URL(window.location.href).searchParams.get('page'),
        10
      )
      const requestedPage =
        Number.isInteger(urlPage) && urlPage > 0 ? urlPage : 1
      const nextPage = Math.min(requestedPage, Math.max(totalPages, 1))

      if (nextPage !== currentPage) {
        setCurrentPage(nextPage)
        window.requestAnimationFrame(scrollToList)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [currentPage, scrollToList, totalPages])

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
      {searchQuery ? (
        <div className={styles.searchSummary}>
          <span>Результаты поиска: «{searchQuery}»</span>
          <Link href="/movies" className={styles.clearSearch}>
            Очистить поиск
          </Link>
        </div>
      ) : null}

      <div ref={listRef}>
        {movies.length ? (
          <MovieGrid movies={visibleMovies} />
        ) : searchQuery ? (
          <div className={styles.emptySearch}>
            <p>По вашему запросу ничего не найдено</p>
          </div>
        ) : (
          <MovieGrid movies={visibleMovies} emptyMessage={emptyMessage} />
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

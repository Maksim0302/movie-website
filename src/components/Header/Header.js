'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import styles from './Header.module.scss'

export default function Header() {
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const searchContainerRef = useRef(null)
  const headerRef = useRef(null)

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
    setSearchError('')
  }, [])

  useEffect(() => {
    if (!isSearchOpen) {
      return
    }

    function handlePointerDown(event) {
      if (!searchContainerRef.current?.contains(event.target)) {
        closeSearch()
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeSearch()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeSearch, isSearchOpen])

  useEffect(() => {
    closeSearch()
  }, [closeSearch, pathname])

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return
    }

    function handlePointerDown(event) {
      if (!headerRef.current?.contains(event.target)) {
        setIsMobileMenuOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const query = searchQuery.trim()

    if (!isSearchOpen || query.length < 2) {
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      setSearchError('')

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(`Search request failed: ${response.status}`)
        }

        const data = await response.json()
        if (!controller.signal.aborted) {
          setSearchResults(data.results || [])
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Search request failed:', error)
          setSearchResults([])
          setSearchError('Не удалось выполнить поиск')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false)
        }
      }
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [isSearchOpen, searchQuery])

  return (
    <header className={styles.header} ref={headerRef}>
      <div className="container">
        <div className={styles.header__content}>
          <Link
            href="/"
            className="logo"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Image
              src="/img/logo/logo.png"
              width={130}
              height={30}
              alt="КиноТерапия"
            />
          </Link>

          <nav
            id="primary-navigation"
            className={`${styles.navigation} ${
              isMobileMenuOpen ? styles.navigationOpen : ''
            }`}
          >
            <Link
              href="/"
              className={`${styles.link} ${
                pathname === '/' ? styles.active : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Главная
            </Link>

            <Link
              href="/movies"
              className={`${styles.link} ${
                pathname.startsWith('/movies') ? styles.active : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Фильмы
            </Link>

            <Link
              href="/series"
              className={`${styles.link} ${
                pathname.startsWith('/series') ? styles.active : ''
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Сериалы
            </Link>

            {/* <Link
            href="/genres"
            className={`${styles.link} ${
              pathname.startsWith('/genres') ? styles.active : ''
            }`}
          >
            Жанры
          </Link> */}
          </nav>

          <button
            type="button"
            className={`${styles.menuToggle} ${
              isMobileMenuOpen ? styles.menuToggleOpen : ''
            }`}
            aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className={styles.actions} ref={searchContainerRef}>
            <button
              type="button"
              className={styles.search}
              aria-label={isSearchOpen ? 'Закрыть поиск' : 'Открыть поиск'}
              aria-expanded={isSearchOpen}
              onClick={() => {
                setIsMobileMenuOpen(false)
                if (isSearchOpen) {
                  closeSearch()
                } else {
                  setIsSearchOpen(true)
                }
              }}
            >
              🔍
            </button>

            {isSearchOpen && (
              <div className={styles.searchPanel}>
                <div className={styles.searchInputWrapper}>
                  <input
                    autoFocus
                    type="search"
                    className={styles.searchInput}
                    placeholder="Введите название фильма или сериала..."
                    aria-label="Поиск фильмов и сериалов"
                    aria-controls="header-search-results"
                    value={searchQuery}
                    onChange={(event) => {
                      const nextQuery = event.target.value
                      setSearchQuery(nextQuery)
                      setSearchResults([])
                      setIsSearching(nextQuery.trim().length >= 2)
                      setSearchError('')
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className={styles.clearSearch}
                      aria-label="Очистить поиск"
                      onClick={() => {
                        setSearchQuery('')
                        setSearchResults([])
                        setSearchError('')
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>

                {searchQuery.trim().length >= 2 && (
                  <div
                    id="header-search-results"
                    className={styles.searchResults}
                    aria-live="polite"
                  >
                    {isSearching ? (
                      <p className={styles.searchMessage}>Поиск...</p>
                    ) : searchError ? (
                      <p className={styles.searchMessage}>{searchError}</p>
                    ) : searchResults.length ? (
                      searchResults.map((result) => (
                        <Link
                          key={`${result.type}-${result.id}`}
                          href={`/${
                            result.type === 'movie' ? 'movies' : 'series'
                          }/${result.slug}`}
                          className={styles.searchResult}
                          onClick={closeSearch}
                        >
                          {result.poster_path ? (
                            <span
                              className={styles.resultPoster}
                              style={{
                                backgroundImage: `url(https://image.tmdb.org/t/p/w92${result.poster_path})`,
                              }}
                              aria-hidden="true"
                            />
                          ) : (
                            <span
                              className={styles.resultPosterPlaceholder}
                              aria-hidden="true"
                            >
                              {result.type === 'movie' ? '🎬' : '📺'}
                            </span>
                          )}
                          <span className={styles.resultDetails}>
                            <span className={styles.resultTitle}>
                              {result.title}
                            </span>
                            <span className={styles.resultType}>
                              {result.type === 'movie' ? 'Фильм' : 'Сериал'}
                            </span>
                          </span>
                        </Link>
                      ))
                    ) : (
                      <p className={styles.searchMessage}>Ничего не найдено</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

'use client'

import { createContext, useContext, useEffect, useState } from 'react'

import VideoPlayer from '../../../components/VideoPlayer/VideoPlayer'
import movieStyles from '../../movies/[slug]/MovieDetailPage.module.scss'
import styles from './SeriesDetailPage.module.scss'

const SeriesPlaybackContext = createContext(null)

export function SeriesPlaybackProvider({
  children,
  initialMode,
  initialSeasonNumber,
}) {
  const [mode, setMode] = useState(initialMode)
  const [selectedSeasonNumber, setSelectedSeasonNumber] =
    useState(initialSeasonNumber)

  return (
    <SeriesPlaybackContext.Provider
      value={{
        mode,
        setMode,
        selectedSeasonNumber,
        setSelectedSeasonNumber,
      }}
    >
      {children}
    </SeriesPlaybackContext.Provider>
  )
}

export function SeriesTrailerButton() {
  const { mode, setMode, setSelectedSeasonNumber } = useContext(
    SeriesPlaybackContext
  )

  return (
    <button
      type="button"
      className={`${movieStyles.watchButton} ${
        mode === 'trailer' ? '' : movieStyles.trailerButtonInactive
      }`}
      aria-pressed={mode === 'trailer'}
      onClick={() => {
        setMode('trailer')
        setSelectedSeasonNumber(null)
      }}
    >
      Смотреть трейлер
    </button>
  )
}

function getEpisodeKey(seasonNumber, episodeNumber) {
  return `${seasonNumber}:${episodeNumber}`
}

function getEpisodeCountLabel(count) {
  const lastTwoDigits = count % 100
  const lastDigit = count % 10

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${count} серий`
  }

  if (lastDigit === 1) {
    return `${count} серия`
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} серии`
  }

  return `${count} серий`
}

export default function SeriesEpisodeSelector({ seasons, trailerUrl }) {
  const { mode, setMode, selectedSeasonNumber, setSelectedSeasonNumber } =
    useContext(SeriesPlaybackContext)
  const firstSeason = seasons[0]
  const [expandedSeasonNumber, setExpandedSeasonNumber] = useState(
    firstSeason?.seasonNumber ?? null
  )
  const [selectedEpisodeKey, setSelectedEpisodeKey] = useState(
    firstSeason?.episodes[0]
      ? getEpisodeKey(
          firstSeason.seasonNumber,
          firstSeason.episodes[0].episodeNumber
        )
      : null
  )
  const [autoPlayNext, setAutoPlayNext] = useState(false)
  const availableEpisodes = seasons
    .flatMap((season) =>
      season.episodes
        .filter((episode) => episode.videoUrl)
        .map((episode) => ({ ...episode, seasonNumber: season.seasonNumber }))
    )
    .sort(
      (first, second) =>
        first.seasonNumber - second.seasonNumber ||
        first.episodeNumber - second.episodeNumber
    )
  const selectedEpisode = seasons
    .find((season) => season.seasonNumber === selectedSeasonNumber)
    ?.episodes.find(
      (episode) =>
        getEpisodeKey(selectedSeasonNumber, episode.episodeNumber) ===
        selectedEpisodeKey
    )

  useEffect(() => {
    if (mode !== 'episode') {
      setAutoPlayNext(false)
    }
  }, [mode])

  function toggleSeason(seasonNumber) {
    setExpandedSeasonNumber((currentSeasonNumber) =>
      currentSeasonNumber === seasonNumber ? null : seasonNumber
    )
  }

  function selectEpisode(seasonNumber, episodeNumber) {
    setSelectedSeasonNumber(seasonNumber)
    setSelectedEpisodeKey(getEpisodeKey(seasonNumber, episodeNumber))
    setAutoPlayNext(false)
    setMode('episode')
  }

  function playNextEpisode() {
    const currentIndex = availableEpisodes.findIndex(
      (episode) =>
        getEpisodeKey(episode.seasonNumber, episode.episodeNumber) ===
        selectedEpisodeKey
    )

    if (currentIndex < 0) {
      return
    }

    const nextEpisode = availableEpisodes[currentIndex + 1]

    if (!nextEpisode) {
      setAutoPlayNext(false)
      return
    }

    setSelectedSeasonNumber(nextEpisode.seasonNumber)
    setSelectedEpisodeKey(
      getEpisodeKey(nextEpisode.seasonNumber, nextEpisode.episodeNumber)
    )
    setExpandedSeasonNumber(nextEpisode.seasonNumber)
    setAutoPlayNext(true)
  }

  return (
    <>
      {mode === 'trailer' ? (
        <VideoPlayer src={trailerUrl} title="Трейлер" />
      ) : mode === 'episode' ? (
        <VideoPlayer
          src={selectedEpisode?.videoUrl || null}
          autoPlay={autoPlayNext}
          onEnded={playNextEpisode}
        />
      ) : null}

      {seasons.length > 0 ? (
        <section
          className={styles.seasonsSection}
          aria-labelledby="seasons-title"
        >
          <h2 id="seasons-title" className={styles.seasonsTitle}>
            Сезоны
          </h2>

          <div className={styles.seasonAccordion}>
            {seasons.map((season) => {
              const isExpanded = expandedSeasonNumber === season.seasonNumber
              const episodes = season.episodes || []
              const seasonPanelId = `season-episodes-${season.seasonNumber}`

              return (
                <section
                  className={`${styles.seasonItem} ${
                    isExpanded ? styles.expandedSeason : ''
                  }`}
                  key={season.seasonNumber}
                >
                  <h3 className={styles.seasonHeading}>
                    <button
                      type="button"
                      className={styles.seasonButton}
                      aria-expanded={isExpanded}
                      aria-controls={seasonPanelId}
                      onClick={() => toggleSeason(season.seasonNumber)}
                    >
                      <span>{season.seasonNumber} сезон</span>
                      <span className={styles.seasonSummary}>
                        {getEpisodeCountLabel(episodes.length)}
                      </span>
                      <span
                        className={`${styles.seasonChevron} ${
                          isExpanded ? styles.chevronExpanded : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </h3>

                  <div
                    id={seasonPanelId}
                    className={styles.episodeList}
                    hidden={!isExpanded}
                  >
                    {episodes.length ? (
                      episodes.map((episode) => {
                        const episodeKey = getEpisodeKey(
                          season.seasonNumber,
                          episode.episodeNumber
                        )
                        const isSelected =
                          selectedEpisodeKey === episodeKey &&
                          mode === 'episode'

                        return (
                          <button
                            key={episodeKey}
                            type="button"
                            className={`${styles.episodeRow} ${
                              isSelected ? styles.activeEpisodeRow : ''
                            }`}
                            aria-pressed={isSelected}
                            aria-label={`Воспроизвести ${episode.episodeNumber} серию`}
                            onClick={() =>
                              selectEpisode(
                                season.seasonNumber,
                                episode.episodeNumber
                              )
                            }
                          >
                            <span className={styles.episodeNumber}>
                              {episode.episodeNumber} серия
                            </span>
                            <span className={styles.episodeSpacer} />
                            {episode.runtime ? (
                              <span className={styles.episodeRuntime}>
                                {episode.runtime} мин
                              </span>
                            ) : null}
                            <span
                              className={styles.episodePlayIcon}
                              aria-hidden="true"
                            >
                              ▶
                            </span>
                          </button>
                        )
                      })
                    ) : (
                      <p className={styles.emptyEpisodes}>
                        В этом сезоне пока нет доступных серий.
                      </p>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </section>
      ) : null}
    </>
  )
}

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

export default function SeriesEpisodeSelector({ seasons, trailerUrl }) {
  const { mode, setMode, selectedSeasonNumber, setSelectedSeasonNumber } =
    useContext(SeriesPlaybackContext)
  const firstSeason = seasons[0]
  const [selectedEpisodeKey, setSelectedEpisodeKey] = useState(
    firstSeason?.episodes[0]
      ? getEpisodeKey(
          firstSeason.seasonNumber,
          firstSeason.episodes[0].episodeNumber
        )
      : null
  )
  const [autoPlayNext, setAutoPlayNext] = useState(false)
  const availableEpisodes = seasons.flatMap((season) =>
    season.episodes
      .filter((episode) => episode.videoUrl)
      .map((episode) => ({ ...episode, seasonNumber: season.seasonNumber }))
  ).sort(
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

  function selectSeason(season) {
    setSelectedSeasonNumber(season.seasonNumber)
    const firstEpisode = season.episodes[0]
    setMode('episode')
    setAutoPlayNext(false)
    setSelectedEpisodeKey(
      firstEpisode
        ? getEpisodeKey(season.seasonNumber, firstEpisode.episodeNumber)
        : null
    )
  }

  function selectEpisode(episodeKey) {
    setSelectedEpisodeKey(episodeKey)
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
    setAutoPlayNext(true)
  }

  return (
    <>
      {seasons.length > 0 ? (
        <>
          <div className={styles.seasonSelector} aria-label="Выбор сезона">
            {seasons.map((season) => (
              <button
                key={season.seasonNumber}
                type="button"
                className={`${styles.seasonButton} ${
                  selectedSeasonNumber === season.seasonNumber
                    ? styles.activeSeasonButton
                    : ''
                }`}
                aria-pressed={selectedSeasonNumber === season.seasonNumber}
                onClick={() => selectSeason(season)}
              >
                {season.seasonNumber} сезон
              </button>
            ))}
          </div>

          <div className={styles.episodeGrid}>
            {seasons
              .find((season) => season.seasonNumber === selectedSeasonNumber)
              ?.episodes.map((episode) => {
                const episodeKey = getEpisodeKey(
                  selectedSeasonNumber,
                  episode.episodeNumber
                )
                const isSelected = selectedEpisodeKey === episodeKey

                return (
                  <button
                    key={episodeKey}
                    type="button"
                    className={`${styles.episodeCard} ${
                      isSelected && mode === 'episode'
                        ? styles.activeEpisodeCard
                        : ''
                    }`}
                    aria-pressed={isSelected && mode === 'episode'}
                    onClick={() => selectEpisode(episodeKey)}
                  >
                    <span className={styles.episodeInfo}>
                      <span className={styles.episodeTitle}>
                        {episode.episodeNumber} серия
                      </span>
                      {episode.runtime ? (
                        <span className={styles.episodeRuntime}>
                          {episode.runtime} мин
                        </span>
                      ) : null}
                    </span>
                    <span className={styles.episodePlayIcon} aria-hidden="true">
                      ▶
                    </span>
                  </button>
                )
              })}
          </div>
        </>
      ) : null}

      {mode === 'trailer' ? (
        <VideoPlayer src={trailerUrl} title="Трейлер" />
      ) : mode === 'episode' ? (
        <>
          <VideoPlayer
            src={selectedEpisode?.videoUrl || null}
            autoPlay={autoPlayNext}
            onEnded={playNextEpisode}
          />
        </>
      ) : null}
    </>
  )
}

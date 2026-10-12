'use client'

import { useState } from 'react'

import VideoPlayer from '@/components/VideoPlayer/VideoPlayer'
import styles from './MoviePlayback.module.scss'

export default function MoviePlayback({
  movieTitle,
  videoUrl,
  trailerVideoId,
  trailerVideoUrl,
}) {
  const [mode, setMode] = useState('full')
  const hasTrailer = Boolean(trailerVideoId?.trim())

  return (
    <div>
      <div
        className={styles.modeSwitch}
        role="group"
        aria-label="Режим просмотра"
      >
        <button
          type="button"
          className={`${styles.modeButton} ${
            mode === 'full' ? styles.active : ''
          }`}
          aria-pressed={mode === 'full'}
          onClick={() => setMode('full')}
        >
          Смотреть полный фильм
        </button>

        {hasTrailer ? (
          <button
            type="button"
            className={`${styles.modeButton} ${
              mode === 'trailer' ? styles.active : ''
            }`}
            aria-pressed={mode === 'trailer'}
            onClick={() => setMode('trailer')}
          >
            Смотреть трейлер
          </button>
        ) : null}
      </div>

      <div className={styles.playerContainer}>
        {mode === 'trailer' && hasTrailer ? (
          <VideoPlayer
            key="trailer"
            src={trailerVideoUrl}
            title={`${movieTitle} — трейлер`}
          />
        ) : videoUrl ? (
          <VideoPlayer key="full" src={videoUrl} title={movieTitle} />
        ) : (
          <div className={styles.unavailable} role="status">
            Полная версия фильма пока недоступна
          </div>
        )}
      </div>
    </div>
  )
}

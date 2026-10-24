'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import VideoPlayer from '@/components/VideoPlayer/VideoPlayer'
import styles from './MoviePlayback.module.scss'

const PROGRESS_INTERVAL = 5000
const MINIMUM_RESUME_POSITION = 5
const ENDING_THRESHOLD = 30

function getProgressStorageKey(movieId) {
  return `movie-playback-progress:${movieId}`
}

function readProgress(movieId) {
  try {
    const storedProgress = window.localStorage.getItem(
      getProgressStorageKey(movieId)
    )

    if (!storedProgress) {
      return null
    }

    const progress = JSON.parse(storedProgress)
    const position = Number(progress.position)
    const duration = Number(progress.duration)

    if (
      progress.movieId !== movieId ||
      !Number.isFinite(position) ||
      position < MINIMUM_RESUME_POSITION ||
      progress.status === 'completed'
    ) {
      return null
    }

    if (
      Number.isFinite(duration) &&
      duration > 0 &&
      duration - position <= ENDING_THRESHOLD
    ) {
      window.localStorage.removeItem(getProgressStorageKey(movieId))
      return null
    }

    return {
      position,
      duration: Number.isFinite(duration) && duration > 0 ? duration : null,
    }
  } catch (error) {
    console.error('[MoviePlayback] Failed to read saved progress:', error)
    return null
  }
}

function formatPlaybackTime(seconds) {
  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

export default function MoviePlayback({
  movieId,
  movieTitle,
  videoUrl,
  trailerVideoId,
  trailerVideoUrl,
}) {
  const [mode, setMode] = useState('full')
  const [progressState, setProgressState] = useState('loading')
  const [savedProgress, setSavedProgress] = useState(null)
  const [restoreTime, setRestoreTime] = useState(null)
  const [autoPlayAfterChoice, setAutoPlayAfterChoice] = useState(false)
  const [restoreError, setRestoreError] = useState(false)
  const playerContainerRef = useRef(null)
  const latestProgress = useRef({ position: 0, duration: null })
  const lastSavedAt = useRef(0)
  const progressSuppressed = useRef(false)
  const hasTrailer = Boolean(trailerVideoId?.trim())
  const playerVisible =
    mode === 'trailer' || progressState === 'ready' || restoreTime !== null

  useEffect(() => {
    const progress = videoUrl ? readProgress(movieId) : null

    setSavedProgress(progress)
    latestProgress.current = progress
      ? { position: progress.position, duration: progress.duration }
      : { position: 0, duration: null }
    lastSavedAt.current = 0
    progressSuppressed.current = false
    setRestoreTime(null)
    setAutoPlayAfterChoice(false)
    setRestoreError(false)
    setProgressState(progress ? 'prompt' : 'ready')
  }, [movieId, videoUrl])

  const clearProgress = useCallback(
    (suppressUntilRestart = false) => {
      try {
        window.localStorage.removeItem(getProgressStorageKey(movieId))
      } catch (error) {
        console.error('[MoviePlayback] Failed to clear saved progress:', error)
      }

      progressSuppressed.current = suppressUntilRestart
      latestProgress.current = { position: 0, duration: null }
      lastSavedAt.current = 0
      setSavedProgress(null)
      setProgressState('ready')
    },
    [movieId]
  )

  const saveProgress = useCallback(
    (progress = latestProgress.current, force = false) => {
      if (progressSuppressed.current) {
        return
      }

      const position = Number(progress.position)
      const duration = Number(progress.duration)

      if (!Number.isFinite(position) || position < MINIMUM_RESUME_POSITION) {
        return
      }

      latestProgress.current = {
        position,
        duration: Number.isFinite(duration) && duration > 0 ? duration : null,
      }

      if (
        Number.isFinite(duration) &&
        duration > 0 &&
        duration - position <= ENDING_THRESHOLD
      ) {
        clearProgress(true)
        return
      }

      const now = Date.now()

      if (!force && now - lastSavedAt.current < PROGRESS_INTERVAL) {
        return
      }

      const record = {
        movieId,
        position,
        duration: latestProgress.current.duration,
        lastWatchedAt: new Date(now).toISOString(),
        status: 'in-progress',
      }

      try {
        window.localStorage.setItem(
          getProgressStorageKey(movieId),
          JSON.stringify(record)
        )
        lastSavedAt.current = now
      } catch (error) {
        console.error('[MoviePlayback] Failed to save progress:', error)
      }
    },
    [clearProgress, movieId]
  )

  useEffect(() => {
    if (mode !== 'full' || progressState !== 'ready' || !videoUrl) {
      return undefined
    }

    const video = playerContainerRef.current?.querySelector('video')
    const getVideoProgress = () =>
      video
        ? { position: video.currentTime, duration: video.duration }
        : latestProgress.current
    const interval = window.setInterval(
      () => saveProgress(getVideoProgress()),
      PROGRESS_INTERVAL
    )
    const saveLatestProgress = () => saveProgress(getVideoProgress(), true)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveLatestProgress()
      }
    }

    video?.addEventListener('pause', saveLatestProgress)
    window.addEventListener('pagehide', saveLatestProgress)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      video?.removeEventListener('pause', saveLatestProgress)
      window.removeEventListener('pagehide', saveLatestProgress)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      saveLatestProgress()
    }
  }, [mode, progressState, saveProgress, videoUrl])

  const handleTimeUpdate = useCallback(
    (progress) => saveProgress(progress),
    [saveProgress]
  )
  const handlePause = useCallback(
    (progress) => saveProgress(progress, true),
    [saveProgress]
  )
  const handleEnded = useCallback(() => {
    clearProgress(true)
  }, [clearProgress])

  function continueWatching() {
    if (!savedProgress) {
      return
    }

    setRestoreError(false)
    setRestoreTime(savedProgress.position)
    setAutoPlayAfterChoice(true)
    setProgressState('ready')
  }

  function watchFromStart() {
    clearProgress()
    setRestoreTime(null)
    setRestoreError(false)
    setAutoPlayAfterChoice(true)
  }

  function handleRestoreComplete() {
    setRestoreError(false)
    setRestoreTime(null)
    setAutoPlayAfterChoice(false)
  }

  function handleRestoreError() {
    setRestoreError(true)
    setRestoreTime(null)
    setAutoPlayAfterChoice(false)
  }

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

      <div className={styles.playerContainer} ref={playerContainerRef}>
        {mode === 'trailer' && hasTrailer ? (
          <VideoPlayer
            key="trailer"
            src={trailerVideoUrl}
            title={`${movieTitle} — трейлер`}
          />
        ) : videoUrl && progressState === 'loading' ? (
          <div className={styles.progressLoading} role="status">
            Подготовка видеоплеера…
          </div>
        ) : mode === 'full' && progressState === 'prompt' ? (
          <section
            className={styles.progressPrompt}
            aria-label="Сохранённый прогресс просмотра"
          >
            <p>
              Вы остановились на отметке{' '}
              <strong>
                {formatPlaybackTime(savedProgress?.position || 0)}
              </strong>
            </p>
            <div className={styles.progressActions}>
              <button
                type="button"
                className={styles.continueButton}
                onClick={continueWatching}
              >
                Продолжить просмотр
              </button>
              <button
                type="button"
                className={styles.restartButton}
                onClick={watchFromStart}
              >
                Смотреть сначала
              </button>
            </div>
          </section>
        ) : restoreError ? (
          <section className={styles.progressPrompt} role="alert">
            <p>
              Не удалось восстановить позицию видео. Вы можете начать фильм
              сначала.
            </p>
            <button
              type="button"
              className={styles.restartButton}
              onClick={watchFromStart}
            >
              Смотреть сначала
            </button>
          </section>
        ) : playerVisible && videoUrl ? (
          <VideoPlayer
            key="full"
            src={videoUrl}
            title={movieTitle}
            initialTime={restoreTime}
            autoPlay={autoPlayAfterChoice}
            autoPlayButtonLabel="Продолжить воспроизведение"
            onTimeUpdate={handleTimeUpdate}
            onPause={handlePause}
            onEnded={handleEnded}
            onRestoreComplete={handleRestoreComplete}
            onRestoreError={handleRestoreError}
          />
        ) : !videoUrl ? (
          <div className={styles.unavailable} role="status">
            Полная версия фильма пока недоступна
          </div>
        ) : null}
      </div>
    </div>
  )
}

'use client'
import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import styles from './VideoPlayer.module.scss'

function isSafariOrIosBrowser() {
  if (typeof navigator === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent.toLowerCase()
  const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
  const isIpadOs =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  const isSafari =
    userAgent.includes('safari') &&
    !userAgent.includes('chrome') &&
    !userAgent.includes('chromium') &&
    !userAgent.includes('android')

  return isIosDevice || isIpadOs || isSafari
}

export default function VideoPlayer({ src }) {
  if (!src) {
    return <div className={styles.empty}>Видео пока недоступно</div>
  }

  return <HlsVideo key={src} src={src} />
}

function HlsVideo({ src }) {
  const videoRef = useRef(null)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return undefined
    }

    let destroyed = false

    setHasError(false)
    setErrorMessage('')

    const supportsNativeHls =
      isSafariOrIosBrowser() &&
      Boolean(video.canPlayType('application/vnd.apple.mpegurl'))

    if (supportsNativeHls) {
      const handleError = () => {
        if (destroyed) {
          return
        }

        const errorCode = video.error?.code
        console.error('[VideoPlayer] Native HLS playback failed:', {
          code: errorCode,
          message: video.error?.message,
        })

        setErrorMessage(
          errorCode === 2
            ? 'Не удалось загрузить видео'
            : errorCode === 3
              ? 'Браузер не смог декодировать видео'
              : 'Видео временно недоступно'
        )
        setHasError(true)
      }

      video.addEventListener('error', handleError)
      video.src = src
      video.load()

      return () => {
        destroyed = true
        video.pause()
        video.removeEventListener('error', handleError)
        video.removeAttribute('src')
        video.load()
      }
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      })
      let mediaRecoveryAttempted = false
      let networkRecoveryAttempted = false

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal || destroyed) {
          return
        }

        const errorReason = data.reason || data.error?.message || ''
        const hasUnsupportedDecoder =
          /DECODER_ERROR_NOT_SUPPORTED|unsupportedconfig/i.test(errorReason)
        const errorDetails = {
          type: data.type,
          details: data.details,
          responseCode: data.response?.code,
          reason: errorReason,
        }

        if (hasUnsupportedDecoder) {
          console.error('[VideoPlayer] Unsupported HLS decoder configuration:', errorDetails)
          setErrorMessage(
            'Браузер не поддерживает аудиоформат этого видео. Проверьте аудиокодек потока.'
          )
          setHasError(true)
          hls.destroy()
          return
        }

        if (
          data.type === Hls.ErrorTypes.MEDIA_ERROR &&
          !mediaRecoveryAttempted
        ) {
          console.warn('[VideoPlayer] Recovering from HLS media error:', errorDetails)
          mediaRecoveryAttempted = true
          hls.recoverMediaError()
          return
        }

        if (
          data.type === Hls.ErrorTypes.NETWORK_ERROR &&
          !networkRecoveryAttempted
        ) {
          console.warn('[VideoPlayer] Retrying HLS network error:', errorDetails)
          networkRecoveryAttempted = true
          hls.startLoad()
          return
        }

        console.error('[VideoPlayer] Unrecoverable fatal HLS error:', errorDetails)
        setErrorMessage('Не удалось загрузить или декодировать видео')
        setHasError(true)
        hls.destroy()
      })

      hls.loadSource(src)
      hls.attachMedia(video)

      return () => {
        destroyed = true
        hls.destroy()
      }
    }

    console.error('[VideoPlayer] HLS is not supported in this browser')
    setErrorMessage('Этот браузер не поддерживает воспроизведение HLS')
    const unsupportedTimer = window.setTimeout(() => {
      setHasError(true)
    }, 0)

    return () => window.clearTimeout(unsupportedTimer)
  }, [src])

  if (hasError) {
    return (
      <div className={styles.empty}>
        <p>Видео пока недоступно</p>
        {errorMessage && <small>{errorMessage}</small>}
      </div>
    )
  }

  return (
    <div className={styles.playerWrapper}>
      <video
        ref={videoRef}
        className={styles.player}
        controls
        playsInline
        preload="metadata"
      />
    </div>
  )
}

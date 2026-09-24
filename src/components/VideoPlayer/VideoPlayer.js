'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

import styles from './VideoPlayer.module.scss'

export default function VideoPlayer({ src }) {
  const videoRef = useRef(null)
  const [isUnavailable, setIsUnavailable] = useState(false)

  useEffect(() => {
    if (!src) {
      setIsUnavailable(true)
      return undefined
    }

    const video = videoRef.current

    if (!video) {
      return undefined
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      return undefined
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      })

      hls.loadSource(src)
      hls.attachMedia(video)

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setIsUnavailable(true)
        }
      })

      return () => {
        hls.destroy()
      }
    }

    setIsUnavailable(true)
    return undefined
  }, [src])

  if (!src || isUnavailable) {
    return <div className={styles.empty}>Видео пока недоступно</div>
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

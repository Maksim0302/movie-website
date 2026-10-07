import Image from 'next/image'

import VideoPlayer from '../../../components/VideoPlayer/VideoPlayer'
import { getSeriesBySlug } from '@/lib/series'
import { getImageUrl } from '@/lib/tmdb'
import styles from './SeriesDetailPage.module.scss'

export async function generateMetadata({ params }) {
  const slug = (await params).slug
  const series = await getSeriesBySlug(slug)

  if (!series) {
    return { title: 'Сериал не найден' }
  }

  return {
    title: `${series.title} — КиноТерапия`,
    description: series.overview || 'Просмотр сериала из каталога КиноТерапии.',
    openGraph: {
      title: `${series.title} — КиноТерапия`,
      description:
        series.overview || 'Просмотр сериала из каталога КиноТерапии.',
      images: series.backdrop
        ? [series.backdrop]
        : [getImageUrl(series.poster_path)],
    },
  }
}

export default async function SeriesDetailPage({ params }) {
  const slug = (await params).slug
  const series = await getSeriesBySlug(slug)

  if (!series) {
    return (
      <section className={`container ${styles.messageSection}`}>
        <div className={styles.message}>Не удалось загрузить сериал.</div>
      </section>
    )
  }

  const releaseYear = series.release_date
    ? new Date(series.release_date).getFullYear()
    : '—'

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <Image
          src={series.backdrop || getImageUrl(series.poster_path, 'w1280')}
          alt={series.title}
          fill
          priority
          className={styles.heroImage}
          sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, 180px"
        />

        <div className={styles.heroOverlay} />

        <div className={`container ${styles.heroContent}`}>
          <div className={styles.seriesLayout}>
            <div className={styles.poster}>
              <Image
                src={series.poster || getImageUrl(series.poster_path)}
                alt={series.title}
                fill
                className={styles.posterImage}
                sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, 180px"
              />
            </div>

            <div className={styles.seriesInfo}>
              <h1 className={styles.title}>{series.title}</h1>
              <p className={styles.originalTitle}>{series.original_title}</p>

              <div className={styles.meta}>
                <span>{releaseYear}</span>
                <span>•</span>
                <span>
                  {series.number_of_seasons}{' '}
                  {series.number_of_seasons === 1 ? 'сезон' : 'сезонов'}
                </span>
                <span>•</span>
                <span>
                  {series.number_of_episodes}{' '}
                  {series.number_of_episodes === 1 ? 'серия' : 'серий'}
                </span>
                <span>•</span>
                <span>★ {Number(series.vote_average || 0).toFixed(1)}</span>
              </div>

              <div className={styles.genres}>
                {(series.genres || []).slice(0, 5).map((genre) => (
                  <span key={genre} className={styles.genre}>
                    {genre}
                  </span>
                ))}
              </div>

              <p className={styles.overview}>{series.overview}</p>

              {series.videoUrl ? (
                <div className={styles.actions}>
                  <a href="#player" className={styles.watchButton}>
                    Смотреть
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className={`container ${styles.playerSection}`}>
        <div id="player" className={styles.playerContainer}>
          <VideoPlayer src={series.videoUrl || null} />
        </div>
      </div>
    </section>
  )
}

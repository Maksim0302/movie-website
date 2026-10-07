import Link from 'next/link'
import Image from 'next/image'

import styles from './PopularSeries.module.scss'

import { getImageUrl } from '@/lib/tmdb'

export default function PopularSeries({ series }) {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Популярные сериалы</h2>

          <Link href="/series" className={styles.all}>
            Смотреть все <span>→</span>
          </Link>
        </div>

        <div className={styles.grid}>
          {series.slice(0, 7).map((item) => (
            <Link
              href={`/series/${item.slug}`}
              className={styles.card}
              key={item.slug}
            >
              <div className={styles.poster}>
                <Image
                  src={item.poster || getImageUrl(item.poster_path)}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 140px, 180px"
                />
              </div>

              <h3 className={styles.name}>{item.title}</h3>

              <div className={styles.info}>
                <span>{item.release_date?.slice(0, 4)}</span>

                <span className={styles.rating}>
                  <span>★</span>

                  {item.vote_average.toFixed(1)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

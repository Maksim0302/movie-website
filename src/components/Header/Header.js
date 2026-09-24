'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import styles from './Header.module.scss'

export default function Header() {
  const pathname = usePathname()

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.header__content}>
          <Link href="/" className="logo">
            <Image
              src="/img/logo/logo.png"
              width={130}
              height={30}
              alt="КиноТерапия"
            />
          </Link>

          <nav className={styles.navigation}>
            <Link
              href="/"
              className={`${styles.link} ${
                pathname === '/' ? styles.active : ''
              }`}
            >
              Главная
            </Link>

            <Link
              href="/movies"
              className={`${styles.link} ${
                pathname.startsWith('/movies') ? styles.active : ''
              }`}
            >
              Фильмы
            </Link>

            <Link
              href="/series"
              className={`${styles.link} ${
                pathname.startsWith('/series') ? styles.active : ''
              }`}
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

          <div className={styles.actions}>
            <Link href="/search" className={styles.search}>
              🔍
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

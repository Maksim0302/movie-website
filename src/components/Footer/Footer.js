import styles from './Footer.module.scss'
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footer__content}>
          <div className={styles.footer__column}>
            <Link href="/" className="logo">
              <Image
                src="/img/logo/logo.png"
                width={100}
                height={20}
                alt="КиноТерапия"
              />
            </Link>

            <span className={styles.footer__description}>
              Лучшие фильмы и сериалы для твоего настроения
            </span>

            <div className={styles.footer__socials}>
              <Link href="#" className={styles.social} aria-label="Telegram">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21.5 3.5L18.2 20c-.25 1.17-.9 1.46-1.83.91l-5.07-3.73-2.45 2.36c-.27.27-.5.5-1.02.5l.37-5.17 9.42-8.51c.41-.37-.09-.58-.64-.21L5.33 13.02.3 11.45c-1.1-.34-1.12-1.1.23-1.63L20.2 2.14c.92-.34 1.73.21 1.3 1.36Z"
                    fill="currentColor"
                  />
                </svg>
              </Link>

              <Link href="#" className={styles.social} aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21.58 7.19a2.99 2.99 0 0 0-2.1-2.12C17.63 4.56 12 4.56 12 4.56s-5.63 0-7.48.51a2.99 2.99 0 0 0-2.1 2.12C1.91 9.05 1.91 12 1.91 12s0 2.95.51 4.81a2.99 2.99 0 0 0 2.1 2.12c1.85.51 7.48.51 7.48.51s5.63 0 7.48-.51a2.99 2.99 0 0 0 2.1-2.12c.51-1.86.51-4.81.51-4.81s0-2.95-.51-4.81Z"
                    fill="currentColor"
                  />
                  <path d="M10 15.43L15 12l-5-3.43v6.86Z" fill="#07111F" />
                </svg>
              </Link>
            </div>
          </div>

          <div className={styles.footer__column}>
            <span className={styles.footer__title}>Навигация</span>

            <nav className={styles.footer__navigation}>
              <Link href="/">Главная</Link>
              <Link href="/movies">Фильмы</Link>
              <Link href="/series">Сериалы</Link>
            </nav>
          </div>
          <div className={styles.footer__column}>
            <span className={styles.footer__title}>Популярные Жанры</span>

            <nav className={styles.footer__navigation}>
              <Link href="/">Боевики</Link>
              <Link href="/movies">Комедии</Link>
              <Link href="/series">Драмы</Link>
              <Link href="/genres">Фантастика</Link>
              <Link href="/genres">Ужасы</Link>
            </nav>
          </div>
        </div>

        <div className={styles.footer__copyright}>
          © 2026 КиноТерапия. Все права защищены.
        </div>
      </div>
    </footer>
  )
}

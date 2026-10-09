import styles from './MovieAvailabilityBadge.module.scss'

const AVAILABILITY_LABELS = {
  full_movie: 'Полный фильм',
  trailer_only: 'Только трейлер',
}

export default function MovieAvailabilityBadge({ status }) {
  if (!Object.hasOwn(AVAILABILITY_LABELS, status)) {
    return null
  }

  const label = AVAILABILITY_LABELS[status]

  return (
    <span className={`${styles.badge} ${styles[status]}`}>{label}</span>
  )
}

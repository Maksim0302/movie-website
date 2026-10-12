export function getMovieAvailabilityStatus(movie) {
  if (typeof movie?.video_id === 'string' && movie.video_id.trim()) {
    return 'full_movie'
  }

  if (
    typeof movie?.trailer_video_id === 'string' &&
    movie.trailer_video_id.trim()
  ) {
    return 'trailer_only'
  }

  return null
}

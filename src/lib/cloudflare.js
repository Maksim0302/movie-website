// export function getCloudflareHlsUrl(videoId) {
//   if (!videoId || typeof videoId !== 'string') {
//     return null
//   }

//   const normalizedVideoId = videoId.trim().replace(/^customer-/, '')

//   if (!normalizedVideoId) {
//     return null
//   }

//   const customerCode = String(process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE || '')
//     .trim()
//     .replace(/^https?:\/\//, '')
//     .replace(/^customer-/, '')
//     .split('.cloudflarestream.com')[0]

//   if (!customerCode) {
//     return null
//   }

//   return `https://customer-${customerCode}.cloudflarestream.com/${normalizedVideoId}/manifest/video.m3u8`
// }

export function getCloudflareHlsUrl(videoId) {
  if (!videoId || typeof videoId !== 'string') {
    return null
  }

  const normalizedVideoId = videoId.trim().replace(/^customer-/, '')

  if (!normalizedVideoId) {
    return null
  }

  const customerCode = String(process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE || '')
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^customer-/, '')
    .split('.cloudflarestream.com')[0]

  if (!customerCode) {
    return null
  }

  return `https://customer-${customerCode}.cloudflarestream.com/${normalizedVideoId}/manifest/video.m3u8`
}

export function getVideoUrl(videoId) {
  if (!videoId || typeof videoId !== 'string') {
    return null
  }

  const normalizedVideoId = videoId.trim()

  if (!normalizedVideoId) {
    return null
  }

  if (normalizedVideoId.startsWith('r2:')) {
    const publicUrl = String(process.env.R2_PUBLIC_URL || '')
      .trim()
      .replace(/\/+$/, '')

    const key = normalizedVideoId.slice(3).replace(/^\/+/, '')

    if (!publicUrl || !key) {
      return null
    }

    const encodedKey = key
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/')

    return `${publicUrl}/${encodedKey}`
  }

  return getCloudflareHlsUrl(normalizedVideoId)
}

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

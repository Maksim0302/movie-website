export function getCloudflareHlsUrl(videoId) {
  if (!videoId || typeof videoId !== 'string') {
    return null
  }

  const customerCode = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE

  if (!customerCode) {
    return null
  }

  return `https://customer-${customerCode}.cloudflarestream.com/${videoId}/manifest/video.m3u8`
}

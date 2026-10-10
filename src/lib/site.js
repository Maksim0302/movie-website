const DEFAULT_SITE_URL = 'https://kinoterapiya.vercel.app'

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL

  try {
    return new URL(configuredUrl || DEFAULT_SITE_URL).origin
  } catch {
    return DEFAULT_SITE_URL
  }
}

export function getAbsoluteUrl(pathname = '/') {
  return new URL(pathname, getSiteUrl()).toString()
}

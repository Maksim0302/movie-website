const DEFAULT_SITE_URL = 'https://kinoterapiya.com'

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL

  try {
    const configuredOrigin = new URL(
      configuredUrl || DEFAULT_SITE_URL
    ).origin

    return configuredOrigin === DEFAULT_SITE_URL
      ? configuredOrigin
      : DEFAULT_SITE_URL
  } catch {
    return DEFAULT_SITE_URL
  }
}

export function getAbsoluteUrl(pathname = '/') {
  return new URL(pathname, getSiteUrl()).toString()
}

export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

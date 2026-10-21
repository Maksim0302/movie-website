const DEFAULT_SITE_URL = 'https://kinoterapiya.com'

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL

  try {
    const configuredOrigin = new URL(configuredUrl || DEFAULT_SITE_URL).origin

    // Всегда используем основной домен КиноТерапии.
    // Старый домен Vercel не должен попадать в SEO-ссылки.
    if (configuredOrigin === DEFAULT_SITE_URL) {
      return configuredOrigin
    }

    return DEFAULT_SITE_URL
  } catch {
    return DEFAULT_SITE_URL
  }
}

export function getAbsoluteUrl(pathname = '/') {
  const siteUrl = getSiteUrl()

  try {
    return new URL(pathname, `${siteUrl}/`).toString()
  } catch {
    return `${siteUrl}/`
  }
}

export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

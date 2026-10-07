import { getSiteUrl } from '@/lib/site'

export default function robots() {
  const siteUrl = getSiteUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: siteUrl ? `${siteUrl}/sitemap.xml` : undefined,
  }
}

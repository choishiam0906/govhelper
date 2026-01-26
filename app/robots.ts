import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://govhelpers.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/try',
          '/login',
          '/register',
          '/about',
          '/terms',
          '/privacy',
          '/dashboard/announcements/*',
          '/dashboard/trends',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/onboarding/',
          '/dashboard/pending-approval/',
          '/dashboard/profile/',
          '/dashboard/billing/',
          '/dashboard/settings/',
          '/dashboard/applications/',
          '/dashboard/matching/',
          '/dashboard/saved/',
          '/dashboard/calendar/',
          '/dashboard/compare/',
          '/dashboard/tracking/',
          '/dashboard/templates/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/dashboard/announcements/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

interface AnnouncementJsonLdProps {
  announcement: {
    id: string
    title: string
    organization?: string | null
    description?: string | null
    application_start?: string | null
    application_end?: string | null
    support_amount?: string | null
    category?: string | null
    updated_at?: string
  }
}

export function AnnouncementJsonLd({ announcement }: AnnouncementJsonLdProps) {
  const baseUrl = 'https://govhelpers.com'

  // 설명 정리 (HTML 태그 제거)
  const cleanDescription = announcement.description
    ? announcement.description.replace(/<[^>]*>/g, '').slice(0, 500)
    : `${announcement.organization || '정부'} 지원사업 공고`

  // JSON-LD 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: announcement.title,
    description: cleanDescription,
    provider: {
      '@type': 'GovernmentOrganization',
      name: announcement.organization || '정부',
    },
    serviceType: announcement.category || '정부지원사업',
    url: `${baseUrl}/dashboard/announcements/${announcement.id}`,
    ...(announcement.application_start && {
      availabilityStarts: announcement.application_start,
    }),
    ...(announcement.application_end && {
      availabilityEnds: announcement.application_end,
    }),
    ...(announcement.support_amount && {
      offers: {
        '@type': 'Offer',
        description: `지원금: ${announcement.support_amount}`,
      },
    }),
    ...(announcement.updated_at && {
      dateModified: announcement.updated_at,
    }),
  }

  // 추가: Event 스키마 (마감일이 있는 경우)
  const eventJsonLd = announcement.application_end
    ? {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: `${announcement.title} 마감`,
        description: `${announcement.title} 지원 마감일`,
        startDate: announcement.application_start || announcement.application_end,
        endDate: announcement.application_end,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        location: {
          '@type': 'VirtualLocation',
          url: `${baseUrl}/dashboard/announcements/${announcement.id}`,
        },
        organizer: {
          '@type': 'Organization',
          name: announcement.organization || '정부',
        },
      }
    : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {eventJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
      )}
    </>
  )
}

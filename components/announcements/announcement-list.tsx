'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Clock,
  Bookmark,
  TrendingUp,
  ChevronRight,
  Flame,
  Sparkles,
  AlertCircle,
  Coins,
  Users,
  Calendar
} from 'lucide-react'
import { CompareButton } from '@/components/compare/compare-button'
import {
  parseSupportAmount,
  getDeadlineStatus,
  formatDateShort,
  isNewAnnouncement,
} from '@/lib/utils/announcement-helpers'

interface Announcement {
  id: string
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  support_amount: string | null
  application_start: string | null
  application_end: string | null
  source: string
  status: string
  created_at?: string
  view_count?: number
  eligibility_criteria?: {
    employeeCount?: { max?: number; description?: string }
    businessAge?: { max?: number; description?: string }
    summary?: string
  } | null
}

interface AnnouncementListProps {
  announcements: Announcement[]
  popularIds?: string[] // 인기 공고 ID 목록
}

// 출처 라벨
const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  narajangteo: '나라장터',
  g2b: '나라장터',
  datagoKr: '공공데이터',
  smes: '중소벤처24',
}

// 출처별 색상
const sourceColors: Record<string, string> = {
  bizinfo: 'bg-blue-100 text-blue-800 border-blue-200',
  kstartup: 'bg-green-100 text-green-800 border-green-200',
  narajangteo: 'bg-purple-100 text-purple-800 border-purple-200',
  g2b: 'bg-purple-100 text-purple-800 border-purple-200',
  datagoKr: 'bg-orange-100 text-orange-800 border-orange-200',
  smes: 'bg-indigo-100 text-indigo-800 border-indigo-200',
}

// D-day 색상
const deadlineColors: Record<string, string> = {
  red: 'bg-red-500 text-white',
  orange: 'bg-orange-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  gray: 'bg-gray-200 text-gray-600',
}

export function AnnouncementList({ announcements, popularIds = [] }: AnnouncementListProps) {
  if (announcements.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">검색 결과가 없어요</p>
        <p className="text-sm text-muted-foreground mt-1">
          다른 검색어나 필터를 사용해 보세요
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => {
        const deadline = getDeadlineStatus(announcement.application_end)
        const amount = parseSupportAmount(announcement.support_amount)
        const isNew = isNewAnnouncement(announcement.created_at || null)
        const isPopular = popularIds.includes(announcement.id)
        const eligibility = announcement.eligibility_criteria

        return (
          <Card
            key={announcement.id}
            className={`hover:shadow-lg transition-all duration-200 border-l-4 ${
              deadline.isClosingSoon
                ? 'border-l-red-500'
                : isNew
                ? 'border-l-blue-500'
                : 'border-l-transparent'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  {/* 상태 배지 라인 */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 마감 임박 배지 */}
                    {deadline.isClosingSoon && (
                      <Badge className="bg-red-500 text-white border-0 animate-pulse">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        마감임박
                      </Badge>
                    )}

                    {/* 신규 배지 */}
                    {isNew && (
                      <Badge className="bg-blue-500 text-white border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        신규
                      </Badge>
                    )}

                    {/* 인기 배지 */}
                    {isPopular && (
                      <Badge className="bg-orange-500 text-white border-0">
                        <Flame className="h-3 w-3 mr-1" />
                        인기
                      </Badge>
                    )}

                    {/* 출처 배지 */}
                    <Badge
                      variant="outline"
                      className={`${sourceColors[announcement.source] || 'bg-gray-100'} border`}
                    >
                      {sourceLabels[announcement.source] || announcement.source}
                    </Badge>

                    {/* 분야 배지 */}
                    {announcement.category && (
                      <Badge variant="outline" className="bg-white">
                        {announcement.category}
                      </Badge>
                    )}
                  </div>

                  {/* 제목 */}
                  <Link
                    href={`/dashboard/announcements/${announcement.id}`}
                    className="block group"
                  >
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {announcement.title}
                    </h3>
                  </Link>

                  {/* 기관명 */}
                  {announcement.organization && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{announcement.organization}</span>
                    </div>
                  )}
                </div>

                {/* D-day 표시 */}
                <div className="shrink-0 text-center">
                  <div className={`px-3 py-2 rounded-lg ${deadlineColors[deadline.color]}`}>
                    <p className="text-xl font-bold">
                      {deadline.isExpired ? '마감' : deadline.label}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateShort(announcement.application_end)} 까지
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* 핵심 정보 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg mb-4">
                {/* 지원금액 */}
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded">
                    <Coins className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">지원금액</p>
                    <p className="text-sm font-semibold text-primary">
                      {amount.display}
                    </p>
                  </div>
                </div>

                {/* 지원유형 */}
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 rounded">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">지원유형</p>
                    <p className="text-sm font-medium">
                      {announcement.support_type || '-'}
                    </p>
                  </div>
                </div>

                {/* 직원수 조건 */}
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">직원수</p>
                    <p className="text-sm font-medium">
                      {eligibility?.employeeCount?.max
                        ? `${eligibility.employeeCount.max}인 이하`
                        : '-'
                      }
                    </p>
                  </div>
                </div>

                {/* 신청기간 */}
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 rounded">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">신청기간</p>
                    <p className="text-sm font-medium">
                      {formatDateShort(announcement.application_start)} ~
                    </p>
                  </div>
                </div>
              </div>

              {/* 자격 요약 (있는 경우) */}
              {eligibility?.summary && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
                  <span className="font-medium text-foreground">자격요건:</span>{' '}
                  {eligibility.summary}
                </p>
              )}

              {/* 액션 버튼 */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="h-9">
                  <Bookmark className="h-4 w-4 mr-1.5" />
                  관심 등록
                </Button>
                <CompareButton
                  announcement={{
                    id: announcement.id,
                    title: announcement.title,
                    organization: announcement.organization,
                    category: announcement.category,
                    support_type: announcement.support_type,
                    support_amount: announcement.support_amount,
                    application_end: announcement.application_end,
                    source: announcement.source,
                  }}
                />
                <Link href={`/dashboard/matching?announcementId=${announcement.id}`}>
                  <Button variant="outline" size="sm" className="h-9">
                    <TrendingUp className="h-4 w-4 mr-1.5" />
                    AI 매칭
                  </Button>
                </Link>
                <Link href={`/dashboard/announcements/${announcement.id}`} className="ml-auto">
                  <Button size="sm" className="h-9">
                    상세 보기
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

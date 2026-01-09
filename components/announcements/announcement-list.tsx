import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Clock, Bookmark, TrendingUp, ChevronRight } from 'lucide-react'

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
}

interface AnnouncementListProps {
  announcements: Announcement[]
}

// 출처 라벨
const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  narajangteo: '나라장터',
  datagoKr: '공공데이터',
}

// 출처별 색상
const sourceColors: Record<string, string> = {
  bizinfo: 'bg-blue-100 text-blue-700',
  kstartup: 'bg-green-100 text-green-700',
  narajangteo: 'bg-purple-100 text-purple-700',
  datagoKr: 'bg-orange-100 text-orange-700',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getDaysLeft(endDate: string | null) {
  if (!endDate) return null
  const end = new Date(endDate)
  const today = new Date()
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export function AnnouncementList({ announcements }: AnnouncementListProps) {
  if (announcements.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">검색 결과가 없습니다</p>
        <p className="text-sm text-muted-foreground mt-1">
          다른 검색어나 필터를 사용해보세요
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => {
        const daysLeft = getDaysLeft(announcement.application_end)

        return (
          <Card key={announcement.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  {/* 배지 */}
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="secondary"
                      className={sourceColors[announcement.source] || ''}
                    >
                      {sourceLabels[announcement.source] || announcement.source}
                    </Badge>
                    {announcement.category && (
                      <Badge variant="outline">{announcement.category}</Badge>
                    )}
                    {announcement.support_type && (
                      <Badge variant="outline">{announcement.support_type}</Badge>
                    )}
                  </div>

                  {/* 제목 */}
                  <Link
                    href={`/dashboard/announcements/${announcement.id}`}
                    className="block"
                  >
                    <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2">
                      {announcement.title}
                    </h3>
                  </Link>
                </div>

                {/* 마감일 표시 */}
                {daysLeft !== null && (
                  <div
                    className={`text-right shrink-0 ${
                      daysLeft <= 7
                        ? 'text-red-500'
                        : daysLeft <= 14
                        ? 'text-orange-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <p className="text-2xl font-bold">D-{daysLeft > 0 ? daysLeft : 0}</p>
                    <p className="text-xs">마감</p>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                {announcement.organization && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>{announcement.organization}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatDate(announcement.application_start)} ~{' '}
                    {formatDate(announcement.application_end)}
                  </span>
                </div>
              </div>

              {announcement.support_amount && (
                <p className="text-sm font-medium text-primary mb-4">
                  지원금액: {announcement.support_amount}
                </p>
              )}

              {/* 액션 버튼 */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4 mr-1" />
                  관심 등록
                </Button>
                <Link href={`/dashboard/matching?announcementId=${announcement.id}`}>
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    매칭 분석
                  </Button>
                </Link>
                <Link href={`/dashboard/announcements/${announcement.id}`}>
                  <Button size="sm">
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

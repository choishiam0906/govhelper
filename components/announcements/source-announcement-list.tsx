'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnnouncementListSkeleton } from '@/components/ui/skeleton'
import { Calendar, Building2, MapPin, RefreshCw, AlertCircle, ChevronRight, Bookmark, TrendingUp, Rocket, Gavel } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Announcement {
  id: string
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  target_company: string | null
  support_amount: string | null
  application_start: string | null
  application_end: string | null
  content: string | null
  source: string
  status: string
}

interface SourceAnnouncementListProps {
  source: string          // 'smes24' | 'bizinfo' | 'kstartup' | 'g2b'
  label: string           // '중소벤처24' | '기업마당' | 'K-Startup' | '나라장터'
  badgeColor: string      // 'bg-blue-600' | 'bg-green-600' | 'bg-purple-600' | 'bg-blue-700'
  showArea?: boolean      // true인 경우 지역 정보 표시 (SMES만)
  icon?: 'default' | 'rocket' | 'gavel'  // 아이콘 유형
  itemLabel?: string      // 항목 단위 ('공고' | '입찰')
}

export function SourceAnnouncementList({
  source,
  label,
  badgeColor,
  showArea = false,
  icon = 'default',
  itemLabel = '공고',
}: SourceAnnouncementListProps) {
  const [data, setData] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: announcements, error: fetchError } = await supabase
        .from('announcements')
        .select('*')
        .eq('source', source)
        .eq('status', 'active')
        .order('application_end', { ascending: true })
        .limit(50)

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setData(announcements || [])
      setLastFetched(new Date().toISOString())
    } catch {
      setError('데이터를 불러오는데 실패했어요')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const today = new Date()
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // 콘텐츠에서 지역 정보 추출 (SMES 전용)
  const extractArea = (content: string | null) => {
    if (!content) return null
    const match = content.match(/지역:\s*([^\n]+)/)
    return match ? match[1].trim() : null
  }

  // 아이콘 렌더링
  const renderIcon = () => {
    if (icon === 'rocket') {
      return <Rocket className="h-3 w-3 mr-1" />
    } else if (icon === 'gavel') {
      return <Gavel className="h-3 w-3 mr-1" />
    }
    return null
  }

  if (loading) {
    return <AnnouncementListSkeleton count={5} />
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
          <Button onClick={fetchData} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="default" className={badgeColor}>
            {renderIcon()}
            {label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            진행 중인 {itemLabel} {data.length}건
          </span>
        </div>
        <Button onClick={fetchData} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {lastFetched && (
        <p className="text-xs text-muted-foreground">
          마지막 업데이트: {new Date(lastFetched).toLocaleString('ko-KR')}
        </p>
      )}

      {/* 공고 목록 */}
      {data.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {source === 'g2b' ? (
              <>
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="mb-2">현재 진행 중인 입찰 공고가 없어요</p>
                <p className="text-xs text-muted-foreground">
                  나라장터 API 키가 설정되어 있는지 확인해주세요
                </p>
              </>
            ) : (
              `현재 진행 중인 ${itemLabel}가 없어요`
            )}
          </CardContent>
        </Card>
      ) : (
        data.map((item) => {
          const area = showArea ? extractArea(item.content) : null
          const daysLeft = getDaysRemaining(item.application_end)

          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* 배지 */}
                    <div className="flex flex-wrap gap-2">
                      {item.category && (
                        <Badge variant="outline">{item.category}</Badge>
                      )}
                      {item.support_type && (
                        <Badge variant="secondary">{item.support_type}</Badge>
                      )}
                    </div>

                    {/* 제목 */}
                    <Link
                      href={`/dashboard/announcements/${item.id}`}
                      className="block"
                    >
                      <CardTitle className="text-lg leading-tight hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </CardTitle>
                    </Link>

                    {item.organization && (
                      <CardDescription className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {item.organization}
                      </CardDescription>
                    )}
                  </div>

                  {/* 마감일 표시 */}
                  {daysLeft !== null ? (
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
                  ) : source === 'bizinfo' ? (
                    <Badge variant="outline">상시</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {/* Bizinfo는 상시모집 케이스 처리 */}
                      {source === 'bizinfo' ? (
                        item.application_start && item.application_end
                          ? `${formatDate(item.application_start)} ~ ${formatDate(item.application_end)}`
                          : item.application_end
                          ? `~ ${formatDate(item.application_end)}`
                          : '상시모집'
                      ) : (
                        `${formatDate(item.application_start)} ~ ${formatDate(item.application_end)}`
                      )}
                    </span>
                  </div>
                  {/* 지역 정보 (SMES 전용) */}
                  {area && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{area}</span>
                    </div>
                  )}
                </div>

                {/* K-Startup/G2B: 지원대상 표시 */}
                {(source === 'kstartup' || source === 'g2b') && item.target_company && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {source === 'kstartup' ? '지원대상: ' : ''}{item.target_company}
                  </p>
                )}

                {item.support_amount && (
                  <p className="text-sm font-medium text-primary mb-4">
                    {source === 'g2b' ? item.support_amount : `지원금액: ${item.support_amount}`}
                  </p>
                )}

                {/* 액션 버튼 */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Bookmark className="h-4 w-4 mr-1" />
                    관심 등록
                  </Button>
                  <Link href={`/dashboard/matching?announcementId=${item.id}`}>
                    <Button variant="outline" size="sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      매칭 분석
                    </Button>
                  </Link>
                  <Link href={`/dashboard/announcements/${item.id}`}>
                    <Button size="sm">
                      상세 보기
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

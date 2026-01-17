'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, Calendar, Building2, RefreshCw, AlertCircle, Hash } from 'lucide-react'

interface BizinfoAnnouncement {
  id: string
  title: string
  organization: string
  bizType: string
  sportType: string
  startDate: string
  endDate: string
  targetScale: string
  detailUrl: string
  content: string
  hashtags: string
  executor: string
}

interface BizinfoResponse {
  success: boolean
  data: BizinfoAnnouncement[]
  meta: {
    total: number
    returned: number
    fetchedAt: string
  }
  error?: string
}

export function BizinfoAnnouncementList() {
  const [data, setData] = useState<BizinfoAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/announcements/bizinfo?limit=50')
      const result: BizinfoResponse = await response.json()

      if (result.success) {
        setData(result.data)
        setLastFetched(result.meta.fetchedAt)
        setTotal(result.meta.total)
      } else {
        setError(result.error || '데이터를 불러오는데 실패했어요')
      }
    } catch (err) {
      setError('서버 연결에 실패했어요')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getDaysRemaining = (endDate: string) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const today = new Date()
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getDeadlineBadge = (endDate: string) => {
    const days = getDaysRemaining(endDate)
    if (days === null) return <Badge variant="outline">상시</Badge>

    if (days <= 0) {
      return <Badge variant="destructive">마감</Badge>
    } else if (days <= 7) {
      return <Badge variant="destructive">D-{days}</Badge>
    } else if (days <= 14) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">D-{days}</Badge>
    }
    return <Badge variant="outline">D-{days}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
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
          <Badge variant="default" className="bg-green-600">기업마당</Badge>
          <span className="text-sm text-muted-foreground">
            전체 {total}건 중 {data.length}건 표시
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
            현재 진행 중인 공고가 없어요
          </CardContent>
        </Card>
      ) : (
        data.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4" />
                    {item.organization}
                    {item.executor && item.executor !== item.organization && (
                      <span className="text-xs">({item.executor})</span>
                    )}
                  </CardDescription>
                </div>
                {getDeadlineBadge(item.endDate)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {item.bizType && (
                  <Badge variant="outline">{item.bizType}</Badge>
                )}
                {item.sportType && (
                  <Badge variant="secondary">{item.sportType}</Badge>
                )}
                {item.targetScale && (
                  <Badge variant="outline">{item.targetScale}</Badge>
                )}
              </div>

              {(item.startDate || item.endDate) && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {item.startDate && item.endDate
                        ? `${item.startDate} ~ ${item.endDate}`
                        : item.endDate
                        ? `~ ${item.endDate}`
                        : '상시모집'}
                    </span>
                  </div>
                </div>
              )}

              {/* 해시태그 */}
              {item.hashtags && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3 flex-wrap">
                  <Hash className="h-3 w-3" />
                  {item.hashtags.split(',').slice(0, 5).map((tag, idx) => (
                    <span key={idx} className="bg-muted px-1.5 py-0.5 rounded">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {item.detailUrl && (
                <Button asChild variant="outline" size="sm">
                  <a href={item.detailUrl} target="_blank" rel="noopener noreferrer">
                    상세보기
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

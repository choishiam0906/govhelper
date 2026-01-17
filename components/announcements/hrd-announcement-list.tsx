'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, Building2, Calendar, Search, RefreshCw, GraduationCap, Clock, Users } from 'lucide-react'
import Link from 'next/link'

interface HRDTraining {
  id: string
  title: string
  organization: string
  category: string
  supportType: string
  targetCompany: string
  supportAmount: string
  startDate: string
  endDate: string
  content: string
  detailUrl: string
  status: string
  source: string
}

export function HRDAnnouncementList() {
  const [trainings, setTrainings] = useState<HRDTraining[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchTrainings = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: '50',
      })

      if (searchKeyword) {
        params.set('keyword', searchKeyword)
      }

      const response = await fetch(`/api/announcements/hrd?${params.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '데이터를 불러오지 못했어요')
      }

      setTrainings(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrainings()
  }, [searchKeyword])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchKeyword(keyword)
  }

  const getDaysRemaining = (endDate: string): number | null => {
    if (!endDate) return null
    const end = new Date(endDate)
    const today = new Date()
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const parseContent = (content: string) => {
    const lines = content.split('\n\n')
    const result: Record<string, string> = {}

    lines.forEach(line => {
      if (line.includes('훈련시간:')) {
        result.trainTime = line.replace('총 훈련시간:', '').trim()
      } else if (line.includes('정원:')) {
        result.capacity = line.replace('정원:', '').trim()
      } else if (line.includes('취업률:')) {
        result.employRate = line.replace('취업률:', '').trim()
      } else if (line.includes('자부담금:')) {
        result.selfBurden = line.replace('자부담금:', '').trim()
      } else if (line.startsWith('http')) {
        result.detailUrl = line
      }
    })

    return result
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchTrainings} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                placeholder="훈련과정명, 훈련기관명 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Button type="submit" variant="secondary">
                <Search className="w-4 h-4" />
              </Button>
            </form>

            <Button onClick={fetchTrainings} variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 훈련과정 목록 */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : trainings.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              조회된 훈련과정이 없어요
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            총 {trainings.length}건의 훈련과정
          </p>

          {trainings.map((item) => {
            const daysRemaining = getDaysRemaining(item.endDate)
            const parsed = parseContent(item.content)
            const detailUrl = parsed.detailUrl || item.detailUrl

            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          직업훈련
                        </Badge>
                        {item.category && (
                          <Badge variant="secondary">{item.category}</Badge>
                        )}
                        {item.supportType && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {item.supportType}
                          </Badge>
                        )}
                        {daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0 && (
                          <Badge variant="destructive">마감임박</Badge>
                        )}
                      </div>
                      <CardTitle className="text-base leading-tight">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {item.organization}
                      </CardDescription>
                    </div>
                    {detailUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={detailUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{item.startDate || '-'} ~ {item.endDate || '-'}</span>
                      {daysRemaining !== null && daysRemaining >= 0 && (
                        <Badge variant={daysRemaining <= 7 ? 'destructive' : 'secondary'} className="ml-1">
                          D-{daysRemaining}
                        </Badge>
                      )}
                    </div>
                    {parsed.trainTime && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{parsed.trainTime}</span>
                      </div>
                    )}
                    {parsed.capacity && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{parsed.capacity}</span>
                      </div>
                    )}
                    {item.supportAmount && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {item.supportAmount}
                      </Badge>
                    )}
                    {parsed.selfBurden && (
                      <Badge variant="outline">
                        자부담: {parsed.selfBurden}
                      </Badge>
                    )}
                    {parsed.employRate && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        취업률 {parsed.employRate}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

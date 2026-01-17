'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ExternalLink, Building2, Calendar, Search, RefreshCw, Banknote, Gavel } from 'lucide-react'
import Link from 'next/link'

interface G2BAnnouncement {
  id: string
  title: string
  organization: string
  demandOrg: string
  bidType: string
  bidMethod: string
  contractMethod: string
  noticeKind: string
  startDate: string
  endDate: string
  openDate: string
  estimatedPrice: number | null
  budgetAmount: number | null
  detailUrl: string
  isReNotice: boolean
  source: string
}

const BID_TYPES = [
  { value: 'all', label: '전체' },
  { value: 'thng', label: '물품' },
  { value: 'servc', label: '용역' },
  { value: 'cnstwk', label: '공사' },
]

export function G2BAnnouncementList() {
  const [announcements, setAnnouncements] = useState<G2BAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bidType, setBidType] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchAnnouncements = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: '50',
        bidType,
      })

      if (searchKeyword) {
        params.set('keyword', searchKeyword)
      }

      const response = await fetch(`/api/announcements/g2b?${params.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '데이터를 불러오지 못했어요')
      }

      setAnnouncements(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [bidType, searchKeyword])

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

  const formatPrice = (price: number | null): string => {
    if (!price) return '-'
    if (price >= 100000000) {
      return `${(price / 100000000).toFixed(1)}억원`
    }
    if (price >= 10000) {
      return `${(price / 10000).toFixed(0)}만원`
    }
    return `${price.toLocaleString()}원`
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchAnnouncements} variant="outline">
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
      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={bidType} onValueChange={setBidType}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="입찰유형" />
              </SelectTrigger>
              <SelectContent>
                {BID_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                placeholder="공고명, 기관명 검색"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <Button type="submit" variant="secondary">
                <Search className="w-4 h-4" />
              </Button>
            </form>

            <Button onClick={fetchAnnouncements} variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 공고 목록 */}
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
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              조회된 입찰공고가 없어요
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            총 {announcements.length}건의 입찰공고
          </p>

          {announcements.map((item) => {
            const daysRemaining = getDaysRemaining(item.endDate)

            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          <Gavel className="w-3 h-3 mr-1" />
                          {item.bidType}
                        </Badge>
                        {item.noticeKind && (
                          <Badge variant="secondary">{item.noticeKind}</Badge>
                        )}
                        {item.isReNotice && (
                          <Badge variant="destructive">재공고</Badge>
                        )}
                        {daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0 && (
                          <Badge variant="destructive">마감임박</Badge>
                        )}
                      </div>
                      <CardTitle className="text-base leading-tight">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {item.organization}
                        {item.demandOrg && item.demandOrg !== item.organization && (
                          <span className="text-xs">({item.demandOrg})</span>
                        )}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={item.detailUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>마감: {item.endDate || '-'}</span>
                      {daysRemaining !== null && daysRemaining >= 0 && (
                        <Badge variant={daysRemaining <= 3 ? 'destructive' : 'secondary'} className="ml-1">
                          D-{daysRemaining}
                        </Badge>
                      )}
                    </div>
                    {item.estimatedPrice && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Banknote className="w-4 h-4" />
                        <span>추정가: {formatPrice(item.estimatedPrice)}</span>
                      </div>
                    )}
                    {item.bidMethod && (
                      <Badge variant="outline">{item.bidMethod}</Badge>
                    )}
                    {item.contractMethod && (
                      <Badge variant="outline">{item.contractMethod}</Badge>
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

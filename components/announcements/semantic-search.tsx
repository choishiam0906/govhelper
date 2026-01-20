'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sparkles,
  Search,
  ArrowRight,
  Building2,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SearchResult {
  id: string
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  support_amount: string | null
  application_end: string | null
  source: string
  similarity: number | null
}

const SOURCE_LABELS: Record<string, string> = {
  smes: '중소벤처24',
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  g2b: '나라장터',
  hrd: 'HRD Korea',
}

const SUGGESTED_QUERIES = [
  '창업 초기 기업 지원금',
  'IT 스타트업 R&D 지원',
  '수출 바우처 지원사업',
  '소상공인 경영 안정',
  '제조업 스마트공장',
  '여성 창업 지원',
  '청년 고용 지원금',
  '친환경 기술 개발',
]

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short',
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

export function SemanticSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchType, setSearchType] = useState<'semantic' | 'keyword'>('semantic')

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('검색어를 입력해주세요')
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const response = await fetch('/api/announcements/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          matchThreshold: 0.4,
          matchCount: 20,
          filters: {
            excludeExpired: true,
          },
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setResults(result.data)
      setSearchType(result.meta.searchType)

      if (result.data.length === 0) {
        toast.info('검색 결과가 없어요. 다른 검색어를 시도해보세요.')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('검색에 실패했어요')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSuggestedQuery = (suggested: string) => {
    setQuery(suggested)
    // 자동 검색
    setTimeout(() => {
      setQuery(suggested)
      handleSearch()
    }, 100)
  }

  return (
    <div className="space-y-6">
      {/* AI 검색 헤더 */}
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="w-5 h-5" />
        <span className="font-medium">AI 시맨틱 검색</span>
        <Badge variant="secondary" className="text-xs">Beta</Badge>
      </div>

      {/* 검색창 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="자연어로 검색해보세요 (예: 직원 5명 IT 스타트업이 받을 수 있는 지원금)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              검색 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              AI 검색
            </>
          )}
        </Button>
      </div>

      {/* 추천 검색어 */}
      {!searched && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">추천 검색어</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map((suggested) => (
              <Button
                key={suggested}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestedQuery(suggested)}
              >
                {suggested}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 검색 결과 */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searched && !loading && (
        <div className="space-y-4">
          {/* 검색 결과 헤더 */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {results.length > 0
                ? `${results.length}개의 관련 공고를 찾았어요`
                : '검색 결과가 없어요'}
              {searchType === 'keyword' && (
                <span className="ml-2 text-orange-600">(키워드 검색 결과)</span>
              )}
            </p>
            {results.length > 0 && (
              <Badge variant="outline">
                {searchType === 'semantic' ? 'AI 시맨틱 검색' : '키워드 검색'}
              </Badge>
            )}
          </div>

          {/* 결과 목록 */}
          {results.map((result) => {
            const daysLeft = getDaysLeft(result.application_end)

            return (
              <Card
                key={result.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/announcements/${result.id}`)}
              >
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {/* 배지 */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {SOURCE_LABELS[result.source] || result.source}
                        </Badge>
                        {result.category && (
                          <Badge variant="secondary" className="text-xs">
                            {result.category}
                          </Badge>
                        )}
                        {result.similarity !== null && (
                          <Badge
                            className={`text-xs ${
                              result.similarity >= 0.7
                                ? 'bg-green-100 text-green-700'
                                : result.similarity >= 0.5
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {Math.round(result.similarity * 100)}% 일치
                          </Badge>
                        )}
                      </div>

                      {/* 제목 */}
                      <h3 className="font-medium line-clamp-2 mb-2">{result.title}</h3>

                      {/* 메타 정보 */}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {result.organization && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {result.organization}
                          </span>
                        )}
                        {result.application_end && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(result.application_end)}
                            {daysLeft !== null && daysLeft > 0 && (
                              <span
                                className={`ml-1 ${
                                  daysLeft <= 7 ? 'text-red-500' : 'text-blue-500'
                                }`}
                              >
                                (D-{daysLeft})
                              </span>
                            )}
                          </span>
                        )}
                        {result.support_amount && (
                          <span className="text-primary font-medium">
                            {result.support_amount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 화살표 */}
                    <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
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

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sparkles,
  ArrowRight,
  Crown,
  Building2,
  Calendar,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import type { RecommendationResult, RecommendationsResponse } from '@/lib/recommendations/types'

function getDaysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null
  const deadline = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600'
  if (score >= 75) return 'text-blue-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-gray-600'
}

function getScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-green-50 border-green-200'
  if (score >= 75) return 'bg-blue-50 border-blue-200'
  if (score >= 60) return 'bg-yellow-50 border-yellow-200'
  return 'bg-gray-50 border-gray-200'
}

export function RecommendedAnnouncements() {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notAllowed, setNotAllowed] = useState(false)
  const [noCompany, setNoCompany] = useState(false)

  const fetchRecommendations = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const response = await fetch('/api/recommendations?limit=5')
      const result: RecommendationsResponse = await response.json()

      if (response.status === 403) {
        setNotAllowed(true)
        return
      }

      if (response.status === 400 && result.error?.includes('기업 정보')) {
        setNoCompany(true)
        return
      }

      if (!result.success) {
        setError(result.error || '추천 공고를 불러오지 못했어요')
        return
      }

      setRecommendations(result.data?.recommendations || [])
    } catch {
      setError('추천 공고를 불러오지 못했어요')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [])

  // Free 사용자에게는 업그레이드 안내
  if (notAllowed) {
    return (
      <Card className="border-dashed border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">맞춤 추천 공고</CardTitle>
          </div>
          <CardDescription>
            Pro 플랜으로 업그레이드하면 회사에 맞는 공고를 자동으로 추천받을 수 있어요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/dashboard/billing" className="gap-2">
              <Crown className="h-4 w-4" />
              Pro 플랜 알아보기
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // 기업 정보 미등록
  if (noCompany) {
    return (
      <Card className="border-dashed border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">맞춤 추천 공고</CardTitle>
          </div>
          <CardDescription>
            기업 정보를 등록하면 맞춤 공고를 추천받을 수 있어요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/dashboard/profile" className="gap-2">
              <Building2 className="h-4 w-4" />
              기업 정보 등록하기
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // 로딩 중
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 에러
  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">맞춤 추천 공고</CardTitle>
          </div>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => fetchRecommendations()}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  // 추천 결과 없음
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">맞춤 추천 공고</CardTitle>
          </div>
          <CardDescription>
            현재 기업 정보와 일치하는 공고가 없어요. 기업 정보를 업데이트하거나 나중에 다시 확인해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/profile">기업 정보 수정</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">회사에 맞는 추천 공고</CardTitle>
          </div>
          <CardDescription>
            기업 정보를 기반으로 자격조건이 맞는 공고를 자동으로 찾았어요
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchRecommendations(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/announcements" className="gap-2">
              전체 보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const daysLeft = getDaysLeft(rec.announcement.applicationEnd)
            const matchedCount = rec.matchedCriteria.filter(c => c.matched).length

            return (
              <Link
                key={rec.announcement.id}
                href={`/dashboard/announcements/${rec.announcement.id}`}
                className="block"
              >
                <div className={`flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${getScoreBgColor(rec.score)}`}>
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-medium line-clamp-2 mb-2">
                      {rec.announcement.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                      {rec.announcement.organization && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {rec.announcement.organization}
                        </span>
                      )}
                      {daysLeft !== null && daysLeft > 0 && (
                        <span className={`flex items-center gap-1 ${daysLeft <= 7 ? 'text-red-500 font-medium' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          D-{daysLeft}
                        </span>
                      )}
                      {rec.announcement.supportAmount && (
                        <span className="text-primary font-medium">
                          {rec.announcement.supportAmount}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rec.matchedCriteria
                        .filter(c => c.matched)
                        .slice(0, 4)
                        .map((criterion) => (
                          <Badge
                            key={criterion.name}
                            variant="secondary"
                            className="text-xs gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            {criterion.name}
                          </Badge>
                        ))}
                      {matchedCount > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{matchedCount - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center min-w-[60px]">
                    <p className={`text-2xl font-bold ${getScoreColor(rec.score)}`}>
                      {rec.score}
                    </p>
                    <p className="text-xs text-muted-foreground">적합도</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

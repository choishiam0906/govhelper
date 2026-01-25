'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  GitCompare,
  ArrowLeft,
  Building2,
  Clock,
  Trash2,
  ExternalLink,
  TrendingUp,
  Coins,
  Users,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Award,
  Star
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCompareStore } from '@/stores/compare-store'

// 출처 라벨
const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  smes: '중소벤처24',
  g2b: '나라장터',
}

// 출처별 색상
const sourceColors: Record<string, string> = {
  bizinfo: 'bg-blue-100 text-blue-700',
  kstartup: 'bg-green-100 text-green-700',
  smes: 'bg-purple-100 text-purple-700',
  g2b: 'bg-orange-100 text-orange-700',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
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

export default function ComparePage() {
  const router = useRouter()
  const { announcements, removeAnnouncement, clearAll } = useCompareStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  if (announcements.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GitCompare className="h-8 w-8" />
              공고 비교
            </h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-16 text-center">
            <GitCompare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">비교할 공고가 없어요</h3>
            <p className="text-muted-foreground mb-4">
              공고 목록에서 비교 버튼을 눌러 공고를 추가해 보세요
            </p>
            <Button asChild>
              <Link href="/dashboard/announcements">공고 검색하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (announcements.length < 2) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GitCompare className="h-8 w-8" />
              공고 비교
            </h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-16 text-center">
            <GitCompare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">비교하려면 최소 2개 공고가 필요해요</h3>
            <p className="text-muted-foreground mb-4">
              현재 {announcements.length}개 선택됨. 공고를 더 추가해 주세요.
            </p>
            <Button asChild>
              <Link href="/dashboard/announcements">공고 더 추가하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 기본 비교 항목
  const basicFields = [
    { key: 'organization', label: '주관기관', icon: Building2 },
    { key: 'category', label: '분류', icon: null },
    { key: 'support_type', label: '지원유형', icon: null },
    { key: 'support_amount', label: '지원금액', icon: Coins, highlight: true },
    { key: 'application_end', label: '마감일', icon: Clock },
    { key: 'source', label: '출처', icon: null },
  ]

  // 지원금액 파싱 함수 (비교용)
  const parseAmount = (amount: string | null): number => {
    if (!amount) return 0
    const numStr = amount.replace(/[^0-9]/g, '')
    if (!numStr) return 0
    let value = parseInt(numStr, 10)
    if (amount.includes('억')) value *= 100000000
    else if (amount.includes('천만')) value *= 10000000
    else if (amount.includes('만')) value *= 10000
    return value
  }

  // 최고 지원금액 찾기
  const amounts = announcements.map(a => parseAmount(a.support_amount))
  const maxAmount = Math.max(...amounts)

  // 마감일 가장 늦은 것 찾기
  const endDates = announcements.map(a => a.application_end ? new Date(a.application_end).getTime() : 0)
  const latestEnd = Math.max(...endDates)

  // 추천 점수 계산 (간단한 버전)
  const getRecommendScore = (announcement: typeof announcements[0]) => {
    let score = 50
    // 지원금액이 높을수록 가점
    const amount = parseAmount(announcement.support_amount)
    if (amount === maxAmount && amount > 0) score += 20
    else if (amount > 0) score += Math.round((amount / maxAmount) * 15)
    // 마감일이 늦을수록 가점
    const endDate = announcement.application_end ? new Date(announcement.application_end).getTime() : 0
    if (endDate === latestEnd && endDate > 0) score += 15
    else if (endDate > 0) {
      const daysLeft = getDaysLeft(announcement.application_end)
      if (daysLeft && daysLeft > 14) score += 10
      else if (daysLeft && daysLeft > 7) score += 5
    }
    // 카테고리/지원유형 있으면 가점
    if (announcement.category) score += 5
    if (announcement.support_type) score += 5
    if (announcement.organization) score += 5
    return Math.min(100, score)
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GitCompare className="h-8 w-8" />
              공고 비교
            </h1>
            <p className="text-muted-foreground mt-1">
              {announcements.length}개 공고를 비교하고 있어요
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={clearAll}>
          <Trash2 className="h-4 w-4 mr-2" />
          전체 삭제
        </Button>
      </div>

      {/* 공고 카드 헤더 */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${announcements.length}, 1fr)` }}>
            {announcements.map((announcement) => {
              const score = getRecommendScore(announcement)
              const amount = parseAmount(announcement.support_amount)
              const isBestAmount = amount === maxAmount && amount > 0
              const endDate = announcement.application_end ? new Date(announcement.application_end).getTime() : 0
              const isLatestEnd = endDate === latestEnd && endDate > 0
              const daysLeft = getDaysLeft(announcement.application_end)

              return (
                <Card key={announcement.id} className="relative">
                  <button
                    onClick={() => removeAnnouncement(announcement.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors z-10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* 추천 점수 */}
                  <div className="absolute top-2 left-2 z-10">
                    <div className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
                      <Star className="h-3 w-3 fill-current" />
                      {score}점
                    </div>
                  </div>

                  <CardHeader className="pt-10 pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className={`${sourceColors[announcement.source] || ''}`}
                      >
                        {sourceLabels[announcement.source] || announcement.source}
                      </Badge>
                      {isBestAmount && (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <Award className="h-3 w-3 mr-1" />
                          최고 금액
                        </Badge>
                      )}
                      {isLatestEnd && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          <Calendar className="h-3 w-3 mr-1" />
                          마감 여유
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base line-clamp-2 pr-6 min-h-[48px]">
                      {announcement.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    {/* 핵심 정보 */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Coins className="h-3.5 w-3.5" />
                          지원금액
                        </span>
                        <span className={`font-medium ${isBestAmount ? 'text-green-600' : ''}`}>
                          {announcement.support_amount || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          마감일
                        </span>
                        <div className="flex items-center gap-2">
                          <span>{formatDate(announcement.application_end)}</span>
                          {daysLeft !== null && daysLeft >= 0 && (
                            <Badge
                              variant={daysLeft <= 7 ? 'destructive' : daysLeft <= 14 ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              D-{daysLeft}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          주관기관
                        </span>
                        <span className="truncate max-w-[150px]">{announcement.organization || '-'}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* 버튼 */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/dashboard/announcements/${announcement.id}`}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          상세
                        </Link>
                      </Button>
                      <Button size="sm" asChild className="flex-1">
                        <Link href={`/dashboard/matching?announcementId=${announcement.id}`}>
                          <TrendingUp className="h-4 w-4 mr-1" />
                          매칭
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* 상세 비교 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">상세 비교</CardTitle>
          <CardDescription>각 항목별로 공고를 비교해 보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[140px]">항목</th>
                  {announcements.map((a) => (
                    <th key={a.id} className="text-left py-3 px-4 font-medium">
                      <span className="line-clamp-1">{a.title}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {basicFields.map((field) => (
                  <tr key={field.key} className="border-b last:border-b-0 hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium text-muted-foreground">
                      <span className="flex items-center gap-2">
                        {field.icon && <field.icon className="h-4 w-4" />}
                        {field.label}
                      </span>
                    </td>
                    {announcements.map((announcement) => {
                      const value = announcement[field.key as keyof typeof announcement]
                      const amount = parseAmount(announcement.support_amount)
                      const isBestAmount = amount === maxAmount && amount > 0

                      // 마감일
                      if (field.key === 'application_end' && value) {
                        const daysLeft = getDaysLeft(value as string)
                        const endDate = new Date(value as string).getTime()
                        const isLatest = endDate === latestEnd
                        return (
                          <td key={announcement.id} className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={isLatest ? 'text-blue-600 font-medium' : ''}>
                                {formatDate(value as string)}
                              </span>
                              {daysLeft !== null && daysLeft >= 0 && (
                                <Badge
                                  variant={daysLeft <= 7 ? 'destructive' : daysLeft <= 14 ? 'secondary' : 'outline'}
                                >
                                  D-{daysLeft}
                                </Badge>
                              )}
                              {isLatest && <CheckCircle className="h-4 w-4 text-blue-500" />}
                            </div>
                          </td>
                        )
                      }

                      // 출처
                      if (field.key === 'source') {
                        return (
                          <td key={announcement.id} className="py-3 px-4">
                            <Badge variant="secondary" className={sourceColors[value as string] || ''}>
                              {sourceLabels[value as string] || value}
                            </Badge>
                          </td>
                        )
                      }

                      // 지원금액
                      if (field.key === 'support_amount') {
                        return (
                          <td key={announcement.id} className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={isBestAmount ? 'text-green-600 font-bold' : 'font-medium'}>
                                {value || '-'}
                              </span>
                              {isBestAmount && <CheckCircle className="h-4 w-4 text-green-500" />}
                            </div>
                          </td>
                        )
                      }

                      return (
                        <td key={announcement.id} className="py-3 px-4 text-sm">
                          {value || '-'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 추천 요약 */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            비교 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* 최고 지원금액 */}
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Coins className="h-4 w-4" />
                최고 지원금액
              </div>
              {(() => {
                const best = announcements.find(a => parseAmount(a.support_amount) === maxAmount)
                return best ? (
                  <div>
                    <p className="font-bold text-lg text-green-600">{best.support_amount}</p>
                    <p className="text-sm text-muted-foreground truncate">{best.title}</p>
                  </div>
                ) : <p className="text-muted-foreground">-</p>
              })()}
            </div>

            {/* 마감 여유 */}
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                마감 여유 있는 공고
              </div>
              {(() => {
                const best = announcements.find(a =>
                  a.application_end && new Date(a.application_end).getTime() === latestEnd
                )
                return best ? (
                  <div>
                    <p className="font-bold text-lg text-blue-600">
                      D-{getDaysLeft(best.application_end)}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{best.title}</p>
                  </div>
                ) : <p className="text-muted-foreground">-</p>
              })()}
            </div>
          </div>

          <Separator className="my-4" />

          <p className="text-sm text-muted-foreground text-center">
            AI 매칭 분석을 받으면 각 공고가 우리 기업에 얼마나 적합한지 자세히 알 수 있어요
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

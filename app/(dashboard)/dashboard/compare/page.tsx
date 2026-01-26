'use client'

import { useEffect, useState, useCallback } from 'react'
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
  Calendar,
  CheckCircle,
  XCircle,
  Award,
  Star,
  FileText,
  Users,
  MapPin,
  Briefcase,
  AlertCircle,
  Shield,
  Target,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCompareStore, type CompareAnnouncement } from '@/stores/compare-store'
import { createClient } from '@/lib/supabase/client'
import type { EvaluationCriteria } from '@/types/evaluation'

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

// 지원금액 파싱 함수
function parseAmount(amount: string | null): number {
  if (!amount) return 0
  const numStr = amount.replace(/[^0-9]/g, '')
  if (!numStr) return 0
  let value = parseInt(numStr, 10)
  if (amount.includes('억')) value *= 100000000
  else if (amount.includes('천만')) value *= 10000000
  else if (amount.includes('만')) value *= 10000
  return value
}

// 금액 포맷팅
function formatMoney(value: number | null | undefined): string {
  if (!value) return '-'
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억원`
  if (value >= 10000) return `${(value / 10000).toFixed(0)}만원`
  return `${value.toLocaleString()}원`
}

export default function ComparePage() {
  const router = useRouter()
  const { announcements, removeAnnouncement, clearAll } = useCompareStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detailedAnnouncements, setDetailedAnnouncements] = useState<CompareAnnouncement[]>([])

  // 상세 정보 로드
  const loadDetailedInfo = useCallback(async () => {
    if (announcements.length === 0) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, organization, category, support_type, support_amount, application_start, application_end, source, eligibility_criteria, evaluation_criteria, description')
        .in('id', announcements.map(a => a.id))

      if (error) throw error

      if (data) {
        setDetailedAnnouncements(data as CompareAnnouncement[])
      }
    } catch (error) {
      console.error('상세 정보 로드 오류:', error)
      // 에러 시 기본 데이터 사용
      setDetailedAnnouncements(announcements)
    } finally {
      setLoading(false)
    }
  }, [announcements])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && announcements.length >= 2) {
      loadDetailedInfo()
    }
  }, [mounted, announcements.length, loadDetailedInfo])

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

  // 상세 정보가 로드된 공고 사용
  const displayAnnouncements = detailedAnnouncements.length > 0 ? detailedAnnouncements : announcements

  // 기본 비교 항목
  const basicFields = [
    { key: 'organization', label: '주관기관', icon: Building2 },
    { key: 'category', label: '분류', icon: null },
    { key: 'support_type', label: '지원유형', icon: null },
    { key: 'support_amount', label: '지원금액', icon: Coins, highlight: true },
    { key: 'application_start', label: '접수시작', icon: Calendar },
    { key: 'application_end', label: '마감일', icon: Clock },
    { key: 'source', label: '출처', icon: null },
  ]

  // 최고 지원금액 찾기
  const amounts = displayAnnouncements.map(a => parseAmount(a.support_amount))
  const maxAmount = Math.max(...amounts)

  // 마감일 가장 늦은 것 찾기
  const endDates = displayAnnouncements.map(a => a.application_end ? new Date(a.application_end).getTime() : 0)
  const latestEnd = Math.max(...endDates)

  // 추천 점수 계산
  const getRecommendScore = (announcement: CompareAnnouncement) => {
    let score = 50
    const amount = parseAmount(announcement.support_amount)
    if (amount === maxAmount && amount > 0) score += 20
    else if (amount > 0) score += Math.round((amount / maxAmount) * 15)
    const endDate = announcement.application_end ? new Date(announcement.application_end).getTime() : 0
    if (endDate === latestEnd && endDate > 0) score += 15
    else if (endDate > 0) {
      const daysLeft = getDaysLeft(announcement.application_end)
      if (daysLeft && daysLeft > 14) score += 10
      else if (daysLeft && daysLeft > 7) score += 5
    }
    if (announcement.category) score += 5
    if (announcement.support_type) score += 5
    if (announcement.organization) score += 5
    return Math.min(100, score)
  }

  // 평가기준이 있는 공고 수
  const evalCount = displayAnnouncements.filter(a => a.evaluation_criteria).length
  // 자격조건이 있는 공고 수
  const eligCount = displayAnnouncements.filter(a => a.eligibility_criteria).length

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
              {displayAnnouncements.length}개 공고를 비교하고 있어요
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
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${displayAnnouncements.length}, 1fr)` }}>
            {displayAnnouncements.map((announcement) => {
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
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
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

      {/* 탭 비교 */}
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            기본 정보
          </TabsTrigger>
          <TabsTrigger value="evaluation" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            평가기준
            {evalCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {evalCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="eligibility" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            자격조건
            {eligCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {eligCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 기본 정보 탭 */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">상세 비교</CardTitle>
              <CardDescription>각 항목별로 공고를 비교해 보세요</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[140px]">항목</th>
                        {displayAnnouncements.map((a) => (
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
                          {displayAnnouncements.map((announcement) => {
                            const value = announcement[field.key as keyof typeof announcement]
                            const amount = parseAmount(announcement.support_amount)
                            const isBestAmount = amount === maxAmount && amount > 0

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

                            if (field.key === 'application_start' && value) {
                              return (
                                <td key={announcement.id} className="py-3 px-4">
                                  {formatDate(value as string)}
                                </td>
                              )
                            }

                            if (field.key === 'source') {
                              const sourceValue = value as string
                              return (
                                <td key={announcement.id} className="py-3 px-4">
                                  <Badge variant="secondary" className={sourceColors[sourceValue] || ''}>
                                    {sourceLabels[sourceValue] || sourceValue || '-'}
                                  </Badge>
                                </td>
                              )
                            }

                            if (field.key === 'support_amount') {
                              return (
                                <td key={announcement.id} className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className={isBestAmount ? 'text-green-600 font-bold' : 'font-medium'}>
                                      {(value as string) || '-'}
                                    </span>
                                    {isBestAmount && <CheckCircle className="h-4 w-4 text-green-500" />}
                                  </div>
                                </td>
                              )
                            }

                            return (
                              <td key={announcement.id} className="py-3 px-4 text-sm">
                                {(value as string) || '-'}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 평가기준 탭 */}
        <TabsContent value="evaluation">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                평가기준 비교
              </CardTitle>
              <CardDescription>
                공고별 평가항목과 배점을 비교해 보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : evalCount === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    비교 중인 공고에 평가기준 정보가 없어요
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 평가기준 요약 테이블 */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[140px]">항목</th>
                          {displayAnnouncements.map((a) => (
                            <th key={a.id} className="text-left py-3 px-4 font-medium">
                              <span className="line-clamp-1">{a.title}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              총점
                            </span>
                          </td>
                          {displayAnnouncements.map((a) => (
                            <td key={a.id} className="py-3 px-4">
                              {a.evaluation_criteria ? (
                                <span className="font-bold text-primary">
                                  {a.evaluation_criteria.totalScore}점
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              합격 기준
                            </span>
                          </td>
                          {displayAnnouncements.map((a) => (
                            <td key={a.id} className="py-3 px-4">
                              {a.evaluation_criteria?.passingScore ? (
                                <span className="font-medium text-green-600">
                                  {a.evaluation_criteria.passingScore}점 이상
                                </span>
                              ) : (
                                <span className="text-muted-foreground">미정</span>
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              심사 단계
                            </span>
                          </td>
                          {displayAnnouncements.map((a) => (
                            <td key={a.id} className="py-3 px-4">
                              {a.evaluation_criteria?.evaluationMethod?.stageNames ? (
                                <div className="flex flex-wrap gap-1">
                                  {a.evaluation_criteria.evaluationMethod.stageNames.map((name, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {i + 1}. {name}
                                    </Badge>
                                  ))}
                                </div>
                              ) : a.evaluation_criteria?.evaluationMethod?.stages ? (
                                <span>{a.evaluation_criteria.evaluationMethod.stages}단계</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              가점 항목
                            </span>
                          </td>
                          {displayAnnouncements.map((a) => (
                            <td key={a.id} className="py-3 px-4">
                              {a.evaluation_criteria?.bonusItems && a.evaluation_criteria.bonusItems.length > 0 ? (
                                <div className="space-y-1">
                                  {a.evaluation_criteria.bonusItems.slice(0, 3).map((bonus, i) => (
                                    <div key={i} className="text-xs">
                                      <Badge variant="secondary" className="mr-1">
                                        +{bonus.score}점
                                      </Badge>
                                      {bonus.name}
                                    </div>
                                  ))}
                                  {a.evaluation_criteria.bonusItems.length > 3 && (
                                    <p className="text-xs text-muted-foreground">
                                      +{a.evaluation_criteria.bonusItems.length - 3}개 더
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 평가항목 상세 비교 */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      평가항목 배점 비교
                    </h4>

                    {/* 모든 카테고리 추출 */}
                    {(() => {
                      const allCategories = new Set<string>()
                      displayAnnouncements.forEach(a => {
                        a.evaluation_criteria?.items?.forEach(item => {
                          allCategories.add(item.category)
                        })
                      })

                      return Array.from(allCategories).map(category => (
                        <div key={category} className="border rounded-lg p-4">
                          <h5 className="font-medium mb-3">{category}</h5>
                          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${displayAnnouncements.length}, 1fr)` }}>
                            {displayAnnouncements.map(a => {
                              const categoryItems = a.evaluation_criteria?.items?.filter(
                                item => item.category === category
                              ) || []
                              const totalCategoryScore = categoryItems.reduce((sum, item) => sum + item.maxScore, 0)

                              return (
                                <div key={a.id} className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground line-clamp-1">{a.title}</span>
                                    <Badge variant="outline">{totalCategoryScore}점</Badge>
                                  </div>
                                  <Progress
                                    value={a.evaluation_criteria ? (totalCategoryScore / a.evaluation_criteria.totalScore) * 100 : 0}
                                    className="h-2"
                                  />
                                  {categoryItems.length > 0 && (
                                    <div className="text-xs text-muted-foreground space-y-1">
                                      {categoryItems.slice(0, 3).map((item, i) => (
                                        <div key={i} className="flex justify-between">
                                          <span className="truncate">{item.name}</span>
                                          <span>{item.maxScore}점</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 자격조건 탭 */}
        <TabsContent value="eligibility">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                자격조건 비교
              </CardTitle>
              <CardDescription>
                공고별 지원자격 조건을 비교해 보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : eligCount === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    비교 중인 공고에 자격조건 정보가 없어요
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[140px]">조건</th>
                        {displayAnnouncements.map((a) => (
                          <th key={a.id} className="text-left py-3 px-4 font-medium">
                            <span className="line-clamp-1">{a.title}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* 기업 유형 */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            기업 유형
                          </span>
                        </td>
                        {displayAnnouncements.map((a) => (
                          <td key={a.id} className="py-3 px-4">
                            {a.eligibility_criteria?.companyTypes?.length ? (
                              <div className="flex flex-wrap gap-1">
                                {a.eligibility_criteria.companyTypes.map((type, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* 직원수 */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            직원수
                          </span>
                        </td>
                        {displayAnnouncements.map((a) => (
                          <td key={a.id} className="py-3 px-4">
                            {a.eligibility_criteria?.employeeCount ? (
                              <div>
                                <span className="font-medium">
                                  {a.eligibility_criteria.employeeCount.min || 0}명
                                  {a.eligibility_criteria.employeeCount.max && ` ~ ${a.eligibility_criteria.employeeCount.max}명`}
                                </span>
                                {a.eligibility_criteria.employeeCount.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {a.eligibility_criteria.employeeCount.description}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">제한 없음</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* 매출액 */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Coins className="h-4 w-4" />
                            매출액
                          </span>
                        </td>
                        {displayAnnouncements.map((a) => (
                          <td key={a.id} className="py-3 px-4">
                            {a.eligibility_criteria?.revenue ? (
                              <div>
                                <span className="font-medium">
                                  {a.eligibility_criteria.revenue.min
                                    ? `${formatMoney(a.eligibility_criteria.revenue.min)} 이상`
                                    : ''}
                                  {a.eligibility_criteria.revenue.min && a.eligibility_criteria.revenue.max && ' ~ '}
                                  {a.eligibility_criteria.revenue.max
                                    ? `${formatMoney(a.eligibility_criteria.revenue.max)} 이하`
                                    : ''}
                                </span>
                                {a.eligibility_criteria.revenue.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {a.eligibility_criteria.revenue.description}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">제한 없음</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* 업력 */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            업력
                          </span>
                        </td>
                        {displayAnnouncements.map((a) => (
                          <td key={a.id} className="py-3 px-4">
                            {a.eligibility_criteria?.businessAge ? (
                              <div>
                                <span className="font-medium">
                                  {a.eligibility_criteria.businessAge.min
                                    ? `${a.eligibility_criteria.businessAge.min}년 이상`
                                    : ''}
                                  {a.eligibility_criteria.businessAge.min && a.eligibility_criteria.businessAge.max && ' ~ '}
                                  {a.eligibility_criteria.businessAge.max
                                    ? `${a.eligibility_criteria.businessAge.max}년 이하`
                                    : ''}
                                </span>
                                {a.eligibility_criteria.businessAge.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {a.eligibility_criteria.businessAge.description}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">제한 없음</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* 지역 */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            지역
                          </span>
                        </td>
                        {displayAnnouncements.map((a) => (
                          <td key={a.id} className="py-3 px-4">
                            {a.eligibility_criteria?.regions?.included?.length ? (
                              <div className="flex flex-wrap gap-1">
                                {a.eligibility_criteria.regions.included.slice(0, 5).map((region, i) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700">
                                    {region}
                                  </Badge>
                                ))}
                                {a.eligibility_criteria.regions.included.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{a.eligibility_criteria.regions.included.length - 5}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-green-600">전국</span>
                            )}
                            {a.eligibility_criteria?.regions?.excluded?.length ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {a.eligibility_criteria.regions.excluded.map((region, i) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-700">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    {region}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </td>
                        ))}
                      </tr>

                      {/* 업종 */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            업종
                          </span>
                        </td>
                        {displayAnnouncements.map((a) => (
                          <td key={a.id} className="py-3 px-4">
                            {a.eligibility_criteria?.industries?.included?.length ? (
                              <div className="flex flex-wrap gap-1">
                                {a.eligibility_criteria.industries.included.slice(0, 3).map((ind, i) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                    {ind}
                                  </Badge>
                                ))}
                                {a.eligibility_criteria.industries.included.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{a.eligibility_criteria.industries.included.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-blue-600">전 업종</span>
                            )}
                            {a.eligibility_criteria?.industries?.excluded?.length ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {a.eligibility_criteria.industries.excluded.slice(0, 3).map((ind, i) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-700">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    {ind}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </td>
                        ))}
                      </tr>

                      {/* 필수 인증 */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            필수 인증
                          </span>
                        </td>
                        {displayAnnouncements.map((a) => (
                          <td key={a.id} className="py-3 px-4">
                            {a.eligibility_criteria?.requiredCertifications?.length ? (
                              <div className="flex flex-wrap gap-1">
                                {a.eligibility_criteria.requiredCertifications.map((cert, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {cert}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">없음</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* 제외 조건 */}
                      <tr className="hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            제외 조건
                          </span>
                        </td>
                        {displayAnnouncements.map((a) => (
                          <td key={a.id} className="py-3 px-4">
                            {a.eligibility_criteria?.exclusions?.length ? (
                              <div className="space-y-1">
                                {a.eligibility_criteria.exclusions.slice(0, 3).map((exc, i) => (
                                  <div key={i} className="text-xs text-red-600 flex items-start gap-1">
                                    <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    {exc}
                                  </div>
                                ))}
                                {a.eligibility_criteria.exclusions.length > 3 && (
                                  <p className="text-xs text-muted-foreground">
                                    +{a.eligibility_criteria.exclusions.length - 3}개 더
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 추천 요약 */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            비교 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* 최고 지원금액 */}
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Coins className="h-4 w-4" />
                최고 지원금액
              </div>
              {(() => {
                const best = displayAnnouncements.find(a => parseAmount(a.support_amount) === maxAmount)
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
                마감 여유
              </div>
              {(() => {
                const best = displayAnnouncements.find(a =>
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

            {/* 평가기준/자격조건 */}
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <FileText className="h-4 w-4" />
                상세 정보
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    평가기준
                  </Badge>
                  <span className="text-sm">{evalCount}개 공고</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    자격조건
                  </Badge>
                  <span className="text-sm">{eligCount}개 공고</span>
                </div>
              </div>
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

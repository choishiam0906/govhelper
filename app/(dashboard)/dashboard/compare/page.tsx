'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GitCompare, ArrowLeft, Building2, Clock, Coins, Calendar, FileText, BarChart3, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCompareStore, type CompareAnnouncement } from '@/stores/compare-store'
import { createClient } from '@/lib/supabase/client'
import { CompareHeader } from './compare-header'
import { AnnouncementCard } from './announcement-card'
import { BasicInfoTable } from './basic-info-table'
import { EvaluationTab } from './evaluation-tab'
import { EligibilityTab } from './eligibility-tab'
import { ComparisonSummary } from './comparison-summary'
import { parseAmount, getDaysLeft } from './utils'
import type { BasicField } from './types'

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

  // 공고가 없거나 2개 미만인 경우 안내
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
            <p className="text-muted-foreground mb-4">공고 목록에서 비교 버튼을 눌러 공고를 추가해 보세요</p>
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
  const basicFields: BasicField[] = [
    { key: 'organization', label: '주관기관', icon: Building2 },
    { key: 'category', label: '분류', icon: null },
    { key: 'support_type', label: '지원유형', icon: null },
    { key: 'support_amount', label: '지원금액', icon: Coins, highlight: true },
    { key: 'application_start', label: '접수시작', icon: Calendar },
    { key: 'application_end', label: '마감일', icon: Clock },
    { key: 'source', label: '출처', icon: null },
  ]

  // 최고 지원금액 찾기
  const amounts = displayAnnouncements.map((a) => parseAmount(a.support_amount))
  const maxAmount = Math.max(...amounts)

  // 마감일 가장 늦은 것 찾기
  const endDates = displayAnnouncements.map((a) => (a.application_end ? new Date(a.application_end).getTime() : 0))
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
  const evalCount = displayAnnouncements.filter((a) => a.evaluation_criteria).length
  // 자격조건이 있는 공고 수
  const eligCount = displayAnnouncements.filter((a) => a.eligibility_criteria).length

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <CompareHeader announcementCount={displayAnnouncements.length} onClearAll={clearAll} />

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

              return (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  score={score}
                  isBestAmount={isBestAmount}
                  isLatestEnd={isLatestEnd}
                  onRemove={removeAnnouncement}
                />
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
          <BasicInfoTable
            announcements={displayAnnouncements}
            basicFields={basicFields}
            maxAmount={maxAmount}
            latestEnd={latestEnd}
            loading={loading}
          />
        </TabsContent>

        {/* 평가기준 탭 */}
        <TabsContent value="evaluation">
          <EvaluationTab announcements={displayAnnouncements} loading={loading} evalCount={evalCount} />
        </TabsContent>

        {/* 자격조건 탭 */}
        <TabsContent value="eligibility">
          <EligibilityTab announcements={displayAnnouncements} loading={loading} eligCount={eligCount} />
        </TabsContent>
      </Tabs>

      {/* 추천 요약 */}
      <ComparisonSummary
        announcements={displayAnnouncements}
        maxAmount={maxAmount}
        latestEnd={latestEnd}
        evalCount={evalCount}
        eligCount={eligCount}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  Loader2,
  Coins,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Target,
  History,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import { DownloadPDFButton } from './download-pdf-button'
import { CompetitionPredictionCard } from '@/components/announcements/competition-prediction'
import { CompetitionAnalysis } from '@/components/matching/competition-analysis'
import { EvaluationCriteria } from '@/types'
import { ContentTab } from './tabs/content-tab'
import { EligibilityTab } from './tabs/eligibility-tab'
import { AttachmentsTab } from './tabs/attachments-tab'
import { EvaluationTab } from './tabs/evaluation-tab'
import { ChangesTab } from './tabs/changes-tab'
import type { Announcement, EligibilityCriteria } from './tabs/types'
import { extractSourceUrl, getDaysLeft, formatDateShort, formatAmount } from './tabs/utils'

interface RelatedAnnouncement {
  id: string
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  support_amount: string | null
  application_end: string | null
  source: string
}

interface AnnouncementDetailProps {
  announcement: Announcement
  isSaved: boolean
  relatedAnnouncements: RelatedAnnouncement[]
}

// 출처 라벨
const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  narajangteo: '나라장터',
  g2b: '나라장터',
  smes: '중소벤처24',
  datagoKr: '공공데이터',
}

// 출처별 색상
const sourceColors: Record<string, string> = {
  bizinfo: 'bg-blue-100 text-blue-800',
  kstartup: 'bg-green-100 text-green-800',
  narajangteo: 'bg-purple-100 text-purple-800',
  g2b: 'bg-purple-100 text-purple-800',
  smes: 'bg-indigo-100 text-indigo-800',
  datagoKr: 'bg-orange-100 text-orange-800',
}

export function AnnouncementDetail({
  announcement: initialAnnouncement,
  isSaved: initialSaved,
  relatedAnnouncements
}: AnnouncementDetailProps) {
  const router = useRouter()
  const [announcement, setAnnouncement] = useState(initialAnnouncement)
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [saving, setSaving] = useState(false)

  const daysLeft = getDaysLeft(announcement.application_end)
  const isExpired = daysLeft !== null && daysLeft < 0
  const isClosingSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7

  const toggleSave = async () => {
    setSaving(true)
    try {
      const method = isSaved ? 'DELETE' : 'POST'
      const response = await fetch('/api/saved-announcements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: announcement.id }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setIsSaved(!isSaved)
      toast.success(isSaved ? '관심 공고를 해제했어요' : '관심 공고로 저장했어요')
    } catch (error) {
      toast.error('오류가 발생했어요')
    } finally {
      setSaving(false)
    }
  }

  const sourceUrl = extractSourceUrl(announcement.parsed_content || announcement.content)

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        목록으로
      </Button>

      {/* 상단 알림 배너 */}
      {isClosingSoon && !isExpired && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="font-medium text-red-800">마감이 얼마 남지 않았어요!</p>
            <p className="text-sm text-red-600">D-{daysLeft} - 서둘러 지원하세요</p>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="flex items-center gap-3 p-4 bg-gray-100 border border-gray-200 rounded-lg">
          <XCircle className="h-5 w-5 text-gray-500 shrink-0" />
          <div>
            <p className="font-medium text-gray-700">이 공고는 마감되었어요</p>
            <p className="text-sm text-gray-500">비슷한 다른 공고를 확인해 보세요</p>
          </div>
        </div>
      )}

      {/* 헤더 섹션 */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          {/* 배지 */}
          <div className="flex flex-wrap gap-2">
            <Badge className={sourceColors[announcement.source] || 'bg-gray-100'}>
              {sourceLabels[announcement.source] || announcement.source}
            </Badge>
            {announcement.category && <Badge variant="outline">{announcement.category}</Badge>}
            {announcement.support_type && <Badge variant="secondary">{announcement.support_type}</Badge>}
            {isExpired && <Badge variant="destructive">마감</Badge>}
            {isClosingSoon && !isExpired && (
              <Badge className="bg-red-500 text-white animate-pulse">마감임박</Badge>
            )}
          </div>

          {/* 제목 */}
          <h1 className="text-2xl lg:text-3xl font-bold leading-tight">{announcement.title}</h1>

          {/* 기관명 */}
          {announcement.organization && (
            <div className="flex items-center gap-2 text-lg text-muted-foreground">
              <Building2 className="h-5 w-5" />
              <span>{announcement.organization}</span>
            </div>
          )}

          {/* 핵심 정보 카드 그리드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            {/* 지원금액 */}
            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Coins className="h-4 w-4" />
                <span className="text-xs font-medium">지원금액</span>
              </div>
              <p className="text-lg font-bold text-primary">
                {formatAmount(announcement.support_amount)}
              </p>
            </div>

            {/* 마감일 */}
            <div className={`p-4 rounded-xl border ${
              isExpired
                ? 'bg-gray-100 border-gray-200'
                : isClosingSoon
                  ? 'bg-red-50 border-red-200'
                  : 'bg-orange-50 border-orange-200'
            }`}>
              <div className={`flex items-center gap-2 mb-1 ${
                isExpired ? 'text-gray-500' : isClosingSoon ? 'text-red-600' : 'text-orange-600'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">마감일</span>
              </div>
              <p className={`text-lg font-bold ${
                isExpired ? 'text-gray-600' : isClosingSoon ? 'text-red-700' : 'text-orange-700'
              }`}>
                {daysLeft !== null ? (isExpired ? '마감됨' : `D-${daysLeft}`) : '상시'}
              </p>
            </div>

            {/* 신청기간 */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium">신청기간</span>
              </div>
              <p className="text-sm font-medium text-blue-800">
                {formatDateShort(announcement.application_start)} ~ {formatDateShort(announcement.application_end)}
              </p>
            </div>

            {/* 지원유형 */}
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">지원유형</span>
              </div>
              <p className="text-sm font-medium text-green-800">
                {announcement.support_type || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* 사이드 액션 카드 */}
        <Card className="lg:w-72 shrink-0 h-fit">
          <CardContent className="pt-6 space-y-3">
            <Button
              variant={isSaved ? 'secondary' : 'outline'}
              className="w-full"
              onClick={toggleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck className="h-4 w-4 mr-2" />
              ) : (
                <Bookmark className="h-4 w-4 mr-2" />
              )}
              {isSaved ? '관심 등록됨' : '관심 등록'}
            </Button>

            <Button asChild className="w-full">
              <Link href={`/dashboard/matching?announcementId=${announcement.id}`}>
                <TrendingUp className="h-4 w-4 mr-2" />
                AI 매칭 분석
              </Link>
            </Button>

            <DownloadPDFButton announcement={announcement} />

            {sourceUrl && (
              <Button asChild variant="outline" className="w-full">
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  원본 사이트
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 경쟁 분석 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompetitionPredictionCard
          announcementId={announcement.id}
        />
        <CompetitionAnalysis announcementId={announcement.id} />
      </div>

      {/* 탭 콘텐츠 */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="content" className="flex-1 sm:flex-none">
            <FileText className="h-4 w-4 mr-2" />
            공고 내용
          </TabsTrigger>
          <TabsTrigger value="eligibility" className="flex-1 sm:flex-none">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            지원 자격
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex-1 sm:flex-none">
            <FileText className="h-4 w-4 mr-2" />
            첨부파일
          </TabsTrigger>
          <TabsTrigger value="evaluation" className="flex-1 sm:flex-none">
            <BarChart3 className="h-4 w-4 mr-2" />
            평가기준
          </TabsTrigger>
          <TabsTrigger value="changes" className="flex-1 sm:flex-none">
            <History className="h-4 w-4 mr-2" />
            변경 이력
          </TabsTrigger>
        </TabsList>

        {/* 공고 내용 탭 */}
        <TabsContent value="content" className="mt-6">
          <ContentTab announcement={announcement} />
        </TabsContent>

        {/* 지원 자격 탭 */}
        <TabsContent value="eligibility" className="mt-6">
          <EligibilityTab
            announcement={announcement}
            onEligibilityUpdated={(criteria: EligibilityCriteria) => {
              setAnnouncement(prev => ({
                ...prev,
                eligibility_criteria: criteria
              }))
            }}
          />
        </TabsContent>

        {/* 첨부파일 탭 */}
        <TabsContent value="attachments" className="mt-6">
          <AttachmentsTab
            announcement={announcement}
            onAttachmentsUpdated={(urls: string[]) => {
              setAnnouncement(prev => ({
                ...prev,
                attachment_urls: urls
              }))
            }}
          />
        </TabsContent>

        {/* 평가기준 탭 */}
        <TabsContent value="evaluation" className="mt-6">
          <EvaluationTab
            announcement={announcement}
            onCriteriaUpdated={(criteria: any) => {
              setAnnouncement(prev => ({
                ...prev,
                evaluation_criteria: criteria
              }))
            }}
          />
        </TabsContent>

        {/* 변경 이력 탭 */}
        <TabsContent value="changes" className="mt-6">
          <ChangesTab announcement={announcement} />
        </TabsContent>
      </Tabs>

      {/* 관련 공고 섹션 */}
      {relatedAnnouncements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              비슷한 공고
            </CardTitle>
            <CardDescription>이 공고와 비슷한 다른 공고예요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedAnnouncements.slice(0, 6).map((related) => {
                const relatedDaysLeft = getDaysLeft(related.application_end)
                const relatedIsExpired = relatedDaysLeft !== null && relatedDaysLeft < 0

                return (
                  <Link
                    key={related.id}
                    href={`/dashboard/announcements/${related.id}`}
                    className="block p-4 border rounded-xl hover:shadow-md hover:border-primary/50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className={`text-xs ${sourceColors[related.source] || ''}`}>
                        {sourceLabels[related.source] || related.source}
                      </Badge>
                      {relatedDaysLeft !== null && (
                        <span className={`text-xs font-medium ${
                          relatedIsExpired ? 'text-gray-500' :
                          relatedDaysLeft <= 7 ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {relatedIsExpired ? '마감' : `D-${relatedDaysLeft}`}
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium line-clamp-2 group-hover:text-primary transition-colors mb-2">
                      {related.title}
                    </h4>
                    {related.organization && (
                      <p className="text-sm text-muted-foreground mb-2">{related.organization}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">
                        {formatAmount(related.support_amount)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

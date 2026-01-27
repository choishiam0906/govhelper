'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DOMPurify from 'isomorphic-dompurify'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
  RefreshCw,
  Users,
  Coins,
  MapPin,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Sparkles,
  Target,
  Info,
  History,
  BarChart3,
} from 'lucide-react'
import { DownloadPDFButton } from './download-pdf-button'
import { ChangeHistory } from '@/components/announcements/change-history'
import { EvaluationCriteriaDisplay } from '@/components/announcements/evaluation-criteria'
import { CompetitionPredictionCard } from '@/components/announcements/competition-prediction'
import { EvaluationCriteria } from '@/types'

interface EligibilityCriteria {
  companyTypes: string[]
  employeeCount: { min: number | null; max: number | null; description: string } | null
  revenue: { min: number | null; max: number | null; description: string } | null
  businessAge: { min: number | null; max: number | null; description: string } | null
  industries: { included: string[]; excluded: string[]; description: string }
  regions: { included: string[]; excluded: string[]; description: string }
  requiredCertifications: string[]
  additionalRequirements: string[]
  exclusions: string[]
  summary: string
  confidence: number
  parsedAt: string
}

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
  parsed_content: string | null
  attachment_urls: string[] | null
  eligibility_criteria: EligibilityCriteria | null
  evaluation_criteria: EvaluationCriteria | null
  source: string
  status: string
  created_at: string
}

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

// 콘텐츠에서 원본 URL 추출 함수
function extractSourceUrl(content: string | null): string | null {
  if (!content) return null

  const patterns = [
    /상세보기\s*:\s*(https?:\/\/[^\s<>"]+)/i,
    /원문\s*:\s*(https?:\/\/[^\s<>"]+)/i,
    /원본\s*링크\s*:\s*(https?:\/\/[^\s<>"]+)/i,
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

// 콘텐츠에서 상세보기 URL 부분 제거
function removeSourceUrlFromContent(content: string | null): string | null {
  if (!content) return null

  return content
    .replace(/상세보기\s*:\s*https?:\/\/[^\s<>"]+/gi, '')
    .replace(/원문\s*:\s*https?:\/\/[^\s<>"]+/gi, '')
    .replace(/원본\s*링크\s*:\s*https?:\/\/[^\s<>"]+/gi, '')
    .trim()
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

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateShort(dateStr: string | null) {
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
  today.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

// 지원금액 포맷팅
function formatAmount(amount: string | null): string {
  if (!amount) return '미정'

  // 이미 형식화된 경우
  if (amount.includes('억') || amount.includes('만') || amount.includes('원')) {
    return amount
  }

  // 숫자만 있는 경우
  const numericStr = amount.replace(/[^0-9]/g, '')
  if (numericStr) {
    const value = parseInt(numericStr, 10)
    if (value >= 100000000) {
      const eok = Math.floor(value / 100000000)
      return `${eok}억원`
    } else if (value >= 10000000) {
      const cheonman = Math.round(value / 10000000)
      return `${cheonman}천만원`
    } else if (value >= 10000) {
      const man = Math.round(value / 10000)
      return `약 ${man.toLocaleString()}만원`
    }
    return `${value.toLocaleString()}원`
  }

  return amount
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
  const [fetchingAttachments, setFetchingAttachments] = useState(false)
  const [parsingEligibility, setParsingEligibility] = useState(false)

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

  const fetchAttachments = async () => {
    setFetchingAttachments(true)
    try {
      const response = await fetch(`/api/announcements/scrape-attachments?id=${announcement.id}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setAnnouncement(prev => ({
        ...prev,
        attachment_urls: result.attachments || []
      }))

      if (result.attachments && result.attachments.length > 0) {
        toast.success(`${result.attachments.length}개의 첨부파일을 찾았어요`)
      } else {
        toast.info('첨부파일이 없어요')
      }
    } catch (error) {
      toast.error('첨부파일을 가져오지 못했어요')
    } finally {
      setFetchingAttachments(false)
    }
  }

  const parseEligibility = async () => {
    setParsingEligibility(true)
    try {
      const response = await fetch(`/api/announcements/parse-eligibility?id=${announcement.id}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setAnnouncement(prev => ({
        ...prev,
        eligibility_criteria: result.data
      }))

      if (result.cached) {
        toast.info('저장된 지원자격 정보를 불러왔어요')
      } else {
        toast.success('지원자격을 분석했어요')
      }
    } catch (error) {
      toast.error('지원자격 분석에 실패했어요')
    } finally {
      setParsingEligibility(false)
    }
  }

  const sourceUrl = extractSourceUrl(announcement.parsed_content || announcement.content)
  const rawContent = removeSourceUrlFromContent(announcement.parsed_content || announcement.content)

  // XSS 방지를 위한 HTML sanitization
  const cleanedContent = useMemo(() => {
    if (!rawContent) return null
    return DOMPurify.sanitize(rawContent, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                     'ul', 'ol', 'li', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
      ALLOW_DATA_ATTR: false,
    })
  }, [rawContent])

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

        {/* 경쟁률 예측 카드 */}
        <CompetitionPredictionCard
          announcementId={announcement.id}
          className="lg:w-72 shrink-0"
        />
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
          <Card>
            <CardContent className="pt-6">
              {cleanedContent ? (
                <div
                  className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-primary"
                  dangerouslySetInnerHTML={{ __html: cleanedContent }}
                />
              ) : (
                <div className="text-center py-12">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">상세 내용이 없어요</p>
                  {sourceUrl && (
                    <Button asChild variant="link" className="mt-2">
                      <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                        원본 사이트에서 확인하기
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 지원 자격 탭 */}
        <TabsContent value="eligibility" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    지원 자격
                  </CardTitle>
                  <CardDescription>이 공고에 지원하기 위한 자격 요건이에요</CardDescription>
                </div>
                {!announcement.eligibility_criteria && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={parseEligibility}
                    disabled={parsingEligibility}
                  >
                    {parsingEligibility ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI 분석
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {announcement.eligibility_criteria ? (
                <div className="space-y-6">
                  {/* 요약 카드 */}
                  {announcement.eligibility_criteria.summary && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Sparkles className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-blue-900 mb-1">AI 분석 요약</p>
                          <p className="text-blue-800">{announcement.eligibility_criteria.summary}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs text-blue-600">분석 신뢰도</span>
                            <Progress
                              value={announcement.eligibility_criteria.confidence * 100}
                              className="h-2 w-24"
                            />
                            <span className="text-xs font-medium text-blue-700">
                              {Math.round(announcement.eligibility_criteria.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 기업 유형 */}
                  {announcement.eligibility_criteria.companyTypes.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">지원 가능 기업 유형</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {announcement.eligibility_criteria.companyTypes.map((type, idx) => (
                          <Badge key={idx} variant="secondary" className="px-3 py-1">
                            <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 규모 조건 그리드 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {announcement.eligibility_criteria.employeeCount && (
                      <div className="p-4 border rounded-xl bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">직원수</span>
                        </div>
                        <p className="text-lg font-semibold text-blue-800">
                          {announcement.eligibility_criteria.employeeCount.description}
                        </p>
                      </div>
                    )}
                    {announcement.eligibility_criteria.revenue && (
                      <div className="p-4 border rounded-xl bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Coins className="h-5 w-5 text-green-600" />
                          <span className="font-medium">매출</span>
                        </div>
                        <p className="text-lg font-semibold text-green-800">
                          {announcement.eligibility_criteria.revenue.description}
                        </p>
                      </div>
                    )}
                    {announcement.eligibility_criteria.businessAge && (
                      <div className="p-4 border rounded-xl bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-5 w-5 text-purple-600" />
                          <span className="font-medium">업력</span>
                        </div>
                        <p className="text-lg font-semibold text-purple-800">
                          {announcement.eligibility_criteria.businessAge.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 지역 */}
                  {announcement.eligibility_criteria.regions.description && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">지역 조건</h4>
                      </div>
                      <p className="text-muted-foreground pl-7">
                        {announcement.eligibility_criteria.regions.description}
                      </p>
                    </div>
                  )}

                  {/* 필요 인증 */}
                  {announcement.eligibility_criteria.requiredCertifications.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">필요 인증/자격</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-7">
                        {announcement.eligibility_criteria.requiredCertifications.map((cert, idx) => (
                          <Badge key={idx} variant="outline" className="bg-amber-50 border-amber-200 text-amber-800">
                            <Award className="h-3 w-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 기타 요건 */}
                  {announcement.eligibility_criteria.additionalRequirements.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">기타 요건</h4>
                      </div>
                      <ul className="space-y-2 pl-7">
                        {announcement.eligibility_criteria.additionalRequirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 지원 제외 대상 */}
                  {announcement.eligibility_criteria.exclusions.length > 0 && (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                      <div className="flex items-center gap-2 mb-3">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <h4 className="font-semibold text-red-800">지원 제외 대상</h4>
                      </div>
                      <ul className="space-y-2">
                        {announcement.eligibility_criteria.exclusions.map((ex, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-red-700">
                            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : announcement.target_company ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium mb-2">지원 대상 (기본 정보)</p>
                    <p className="text-muted-foreground">{announcement.target_company}</p>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    'AI 분석' 버튼을 클릭하면 더 자세한 지원자격 정보를 확인할 수 있어요
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">지원자격 정보가 없어요</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI가 공고 내용에서 지원자격을 분석해드려요
                  </p>
                  <Button variant="outline" onClick={parseEligibility} disabled={parsingEligibility}>
                    {parsingEligibility ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI로 분석하기
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 첨부파일 탭 */}
        <TabsContent value="attachments" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>첨부파일</CardTitle>
                  <CardDescription>공고와 관련된 첨부파일이에요</CardDescription>
                </div>
                {(!announcement.attachment_urls || announcement.attachment_urls.length === 0) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAttachments}
                    disabled={fetchingAttachments}
                  >
                    {fetchingAttachments ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        가져오는 중...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        첨부파일 가져오기
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {announcement.attachment_urls && announcement.attachment_urls.length > 0 ? (
                <div className="space-y-2">
                  {announcement.attachment_urls.map((url, index) => {
                    const fileName = url.split('/').pop() || `첨부파일 ${index + 1}`
                    return (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors group"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <span className="flex-1 truncate">{decodeURIComponent(fileName)}</span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </a>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">첨부파일이 아직 로드되지 않았어요</p>
                  <p className="text-sm text-muted-foreground">
                    '첨부파일 가져오기' 버튼을 클릭하여 원본 공고에서 첨부파일을 가져올 수 있어요
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 평가기준 탭 */}
        <TabsContent value="evaluation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                평가기준
              </CardTitle>
              <CardDescription>
                이 공고의 심사 평가기준 및 배점이에요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EvaluationCriteriaDisplay
                announcementId={announcement.id}
                initialCriteria={announcement.evaluation_criteria}
                onCriteriaLoaded={(criteria) => {
                  setAnnouncement(prev => ({
                    ...prev,
                    evaluation_criteria: criteria
                  }))
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 변경 이력 탭 */}
        <TabsContent value="changes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                변경 이력
              </CardTitle>
              <CardDescription>
                이 공고의 지원금액, 마감일 등 주요 정보 변경 내역이에요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangeHistory announcementId={announcement.id} />
            </CardContent>
          </Card>
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

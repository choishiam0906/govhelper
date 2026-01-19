'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  RefreshCw,
} from 'lucide-react'
import { DownloadPDFButton } from './download-pdf-button'

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
  source: string
  status: string
  created_at: string
}

// 콘텐츠에서 원본 URL 추출 함수
function extractSourceUrl(content: string | null): string | null {
  if (!content) return null

  // "상세보기: URL" 또는 "상세보기 : URL" 패턴 매칭
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
}

// 출처 라벨
const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  narajangteo: '나라장터',
  datagoKr: '공공데이터',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
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

export function AnnouncementDetail({ announcement: initialAnnouncement, isSaved: initialSaved }: AnnouncementDetailProps) {
  const router = useRouter()
  const [announcement, setAnnouncement] = useState(initialAnnouncement)
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [saving, setSaving] = useState(false)
  const [fetchingAttachments, setFetchingAttachments] = useState(false)
  const [parsingEligibility, setParsingEligibility] = useState(false)

  const daysLeft = getDaysLeft(announcement.application_end)

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

      // 공고 상태 업데이트
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

      // 공고 상태 업데이트
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

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        목록으로
      </Button>

      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge>{sourceLabels[announcement.source] || announcement.source}</Badge>
            {announcement.category && <Badge variant="outline">{announcement.category}</Badge>}
            {announcement.support_type && <Badge variant="secondary">{announcement.support_type}</Badge>}
            {announcement.status === 'closed' && <Badge variant="destructive">마감</Badge>}
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold mb-4">{announcement.title}</h1>

          <div className="flex flex-wrap gap-4 text-muted-foreground">
            {announcement.organization && (
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>{announcement.organization}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(announcement.application_start)} ~ {formatDate(announcement.application_end)}
              </span>
            </div>
          </div>
        </div>

        {/* 사이드 카드 */}
        <Card className="lg:w-80 shrink-0">
          <CardContent className="pt-6 space-y-4">
            {/* 마감일 */}
            {daysLeft !== null && (
              <div className={`text-center p-4 rounded-lg ${
                daysLeft <= 7 ? 'bg-red-50 text-red-700' :
                daysLeft <= 14 ? 'bg-orange-50 text-orange-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                <p className="text-3xl font-bold">D-{daysLeft > 0 ? daysLeft : 0}</p>
                <p className="text-sm">마감까지</p>
              </div>
            )}

            {/* 지원금액 */}
            {announcement.support_amount && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">지원금액</p>
                <p className="text-xl font-bold">{announcement.support_amount}</p>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="space-y-2">
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 내용 탭 */}
      {(() => {
        const sourceUrl = extractSourceUrl(announcement.parsed_content || announcement.content)
        const cleanedContent = removeSourceUrlFromContent(announcement.parsed_content || announcement.content)

        return (
          <Tabs defaultValue="content" className="w-full">
            <TabsList>
              <TabsTrigger value="content">공고 내용</TabsTrigger>
              <TabsTrigger value="requirements">지원 자격</TabsTrigger>
              <TabsTrigger value="attachments">첨부파일</TabsTrigger>
              {sourceUrl && <TabsTrigger value="visit">직접방문</TabsTrigger>}
            </TabsList>

            <TabsContent value="content" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  {cleanedContent ? (
                    <div
                      className="prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: cleanedContent,
                      }}
                    />
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      상세 내용이 없습니다
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requirements" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>지원 자격</CardTitle>
                      <CardDescription>이 공고에 지원하기 위한 자격 요건입니다</CardDescription>
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
                            <RefreshCw className="h-4 w-4 mr-2" />
                            AI 상세 분석
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {announcement.eligibility_criteria ? (
                    <div className="space-y-6">
                      {/* 요약 */}
                      {announcement.eligibility_criteria.summary && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            {announcement.eligibility_criteria.summary}
                          </p>
                          <p className="text-xs text-blue-600 mt-2">
                            분석 신뢰도: {Math.round(announcement.eligibility_criteria.confidence * 100)}%
                          </p>
                        </div>
                      )}

                      {/* 기업 유형 */}
                      {announcement.eligibility_criteria.companyTypes.length > 0 && (
                        <div>
                          <p className="font-medium mb-2">기업 유형</p>
                          <div className="flex flex-wrap gap-2">
                            {announcement.eligibility_criteria.companyTypes.map((type, idx) => (
                              <Badge key={idx} variant="secondary">{type}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 규모 조건 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {announcement.eligibility_criteria.employeeCount && (
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground">직원수</p>
                            <p className="font-medium">{announcement.eligibility_criteria.employeeCount.description}</p>
                          </div>
                        )}
                        {announcement.eligibility_criteria.revenue && (
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground">매출</p>
                            <p className="font-medium">{announcement.eligibility_criteria.revenue.description}</p>
                          </div>
                        )}
                        {announcement.eligibility_criteria.businessAge && (
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm text-muted-foreground">업력</p>
                            <p className="font-medium">{announcement.eligibility_criteria.businessAge.description}</p>
                          </div>
                        )}
                      </div>

                      {/* 업종 조건 */}
                      {(announcement.eligibility_criteria.industries.included.length > 0 ||
                        announcement.eligibility_criteria.industries.excluded.length > 0) && (
                        <div>
                          <p className="font-medium mb-2">업종</p>
                          {announcement.eligibility_criteria.industries.included.length > 0 && (
                            <div className="mb-2">
                              <span className="text-sm text-green-600 mr-2">지원 가능:</span>
                              {announcement.eligibility_criteria.industries.included.join(', ')}
                            </div>
                          )}
                          {announcement.eligibility_criteria.industries.excluded.length > 0 && (
                            <div>
                              <span className="text-sm text-red-600 mr-2">지원 불가:</span>
                              {announcement.eligibility_criteria.industries.excluded.join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 지역 조건 */}
                      {announcement.eligibility_criteria.regions.description && (
                        <div>
                          <p className="font-medium mb-2">지역</p>
                          <p className="text-muted-foreground">{announcement.eligibility_criteria.regions.description}</p>
                        </div>
                      )}

                      {/* 필요 인증 */}
                      {announcement.eligibility_criteria.requiredCertifications.length > 0 && (
                        <div>
                          <p className="font-medium mb-2">필요 인증/자격</p>
                          <div className="flex flex-wrap gap-2">
                            {announcement.eligibility_criteria.requiredCertifications.map((cert, idx) => (
                              <Badge key={idx} variant="outline">{cert}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 기타 요건 */}
                      {announcement.eligibility_criteria.additionalRequirements.length > 0 && (
                        <div>
                          <p className="font-medium mb-2">기타 요건</p>
                          <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            {announcement.eligibility_criteria.additionalRequirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 지원 제외 대상 */}
                      {announcement.eligibility_criteria.exclusions.length > 0 && (
                        <div className="p-4 bg-red-50 rounded-lg">
                          <p className="font-medium mb-2 text-red-800">지원 제외 대상</p>
                          <ul className="list-disc list-inside text-red-700 space-y-1">
                            {announcement.eligibility_criteria.exclusions.map((ex, idx) => (
                              <li key={idx}>{ex}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : announcement.target_company ? (
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium mb-2">지원 대상 (기본 정보)</p>
                        <p className="text-muted-foreground">{announcement.target_company}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        &apos;AI 상세 분석&apos; 버튼을 클릭하면 더 자세한 지원자격 정보를 확인할 수 있어요
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        지원자격 정보가 없어요
                      </p>
                      <p className="text-sm text-muted-foreground">
                        &apos;AI 상세 분석&apos; 버튼을 클릭하면 공고 내용에서 지원자격을 분석해드려요
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>첨부파일</CardTitle>
                      <CardDescription>공고와 관련된 첨부파일입니다</CardDescription>
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
                        // URL에서 파일명 추출
                        const fileName = url.split('/').pop() || `첨부파일 ${index + 1}`
                        return (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 truncate">{decodeURIComponent(fileName)}</span>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </a>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        첨부파일이 아직 로드되지 않았어요
                      </p>
                      <p className="text-xs text-muted-foreground">
                        &apos;첨부파일 가져오기&apos; 버튼을 클릭하여 원본 공고에서 첨부파일을 가져올 수 있어요
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {sourceUrl && (
              <TabsContent value="visit" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>직접방문</CardTitle>
                    <CardDescription>원본 공고 사이트로 이동하여 더 자세한 정보를 확인하세요</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">원본 공고 링크</p>
                        <p className="text-sm break-all font-mono">{sourceUrl}</p>
                      </div>
                      <Button asChild className="w-full" size="lg">
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          원본 사이트에서 확인하기
                        </a>
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        새 탭에서 원본 공고 페이지가 열립니다
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )
      })()}
    </div>
  )
}

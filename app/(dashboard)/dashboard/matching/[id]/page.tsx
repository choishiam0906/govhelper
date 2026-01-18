import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, ExternalLink, FileText, Trash2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { ScoreGauge } from '@/components/matching/score-gauge'
import { AnalysisCard } from '@/components/matching/analysis-card'
import { EligibilityCard } from '@/components/matching/eligibility-card'
import { MatchAnalysis } from '@/types'
import { DeleteMatchButton } from './delete-match-button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MatchingDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 기업 정보 조회
  const { data: companyData } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const company = companyData as { id: string } | null

  if (!company) {
    notFound()
  }

  // 매칭 결과 조회
  const { data: matchData, error } = await supabase
    .from('matches')
    .select(`
      id,
      match_score,
      analysis,
      created_at,
      announcements (
        id,
        title,
        organization,
        category,
        support_type,
        support_amount,
        application_end,
        source
      )
    `)
    .eq('id', id)
    .eq('company_id', company.id)
    .single()

  if (error || !matchData) {
    notFound()
  }

  const match = matchData as {
    id: string
    match_score: number
    analysis: any
    created_at: string
    announcements: any
  }

  const analysis = match.analysis as MatchAnalysis
  const announcement = match.announcements as any

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      narajangteo: '나라장터',
      bizinfo: '기업마당',
      kstartup: 'K-Startup',
      datagoKr: '공공데이터',
    }
    return labels[source] || source
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/matching">
                <ArrowLeft className="h-4 w-4 mr-1" />
                목록으로
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold">{announcement?.title || '삭제된 공고'}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {announcement?.organization && (
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {announcement.organization}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              분석일: {new Date(match.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
        <DeleteMatchButton matchId={match.id} />
      </div>

      {/* 1단계: 자격 조건 검토 */}
      {analysis.eligibility && (
        <EligibilityCard eligibility={analysis.eligibility} />
      )}

      {/* 2단계: 종합 점수 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>2단계: 적합도 점수</CardTitle>
              <CardDescription>
                {analysis.eligibility?.isEligible
                  ? '자격 조건을 충족하여 적합도 점수를 산정했어요'
                  : '자격 미달이지만 참고용으로 점수를 표시해요'}
              </CardDescription>
            </div>
            {analysis.eligibility && !analysis.eligibility.isEligible && (
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                참고용
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* 종합 점수 게이지 */}
            <div className="flex-shrink-0">
              <ScoreGauge
                score={analysis.eligibility?.isEligible ? analysis.overallScore : 0}
                size="lg"
                label="종합 매칭 점수"
              />
              {analysis.eligibility && !analysis.eligibility.isEligible && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  (자격 미달로 0점 처리)
                </p>
              )}
            </div>

            {/* 세부 점수 */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center p-3 bg-muted rounded-lg">
                <ScoreGauge
                  score={analysis.technicalScore || 0}
                  maxScore={25}
                  size="sm"
                  showLabel={false}
                />
                <p className="text-sm font-medium mt-2">기술성</p>
                <p className="text-xs text-muted-foreground">{analysis.technicalScore || 0}/25점</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <ScoreGauge
                  score={analysis.marketScore || 0}
                  maxScore={20}
                  size="sm"
                  showLabel={false}
                />
                <p className="text-sm font-medium mt-2">시장성</p>
                <p className="text-xs text-muted-foreground">{analysis.marketScore || 0}/20점</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <ScoreGauge
                  score={analysis.businessScore || 0}
                  maxScore={20}
                  size="sm"
                  showLabel={false}
                />
                <p className="text-sm font-medium mt-2">사업성</p>
                <p className="text-xs text-muted-foreground">{analysis.businessScore || 0}/20점</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <ScoreGauge
                  score={analysis.fitScore || 0}
                  maxScore={25}
                  size="sm"
                  showLabel={false}
                />
                <p className="text-sm font-medium mt-2">공고부합도</p>
                <p className="text-xs text-muted-foreground">{analysis.fitScore || 0}/25점</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <ScoreGauge
                  score={analysis.bonusPoints || 0}
                  maxScore={10}
                  size="sm"
                  showLabel={false}
                />
                <p className="text-sm font-medium mt-2">가점</p>
                <p className="text-xs text-muted-foreground">{analysis.bonusPoints || 0}/10점</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 분석 상세 */}
      <div className="grid md:grid-cols-3 gap-4">
        <AnalysisCard type="strengths" items={analysis.strengths} />
        <AnalysisCard type="weaknesses" items={analysis.weaknesses} />
        <AnalysisCard type="recommendations" items={analysis.recommendations} />
      </div>

      {/* 공고 정보 */}
      {announcement && (
        <Card>
          <CardHeader>
            <CardTitle>공고 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">분류</p>
                  <p className="font-medium">{announcement.category || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">지원유형</p>
                  <p className="font-medium">{announcement.support_type || '-'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">지원금액</p>
                  <p className="font-medium">{announcement.support_amount || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">접수마감</p>
                  <p className="font-medium">
                    {announcement.application_end
                      ? new Date(announcement.application_end).toLocaleDateString('ko-KR')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button asChild>
                <Link href={`/dashboard/announcements/${announcement.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  공고 상세보기
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/applications/new?announcementId=${announcement.id}&matchId=${match.id}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  AI 지원서 작성
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 점수 해석 가이드 */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">점수 해석 가이드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">1단계: 자격 조건</p>
            <p className="text-xs text-muted-foreground">
              공고의 지원 자격 요건(업종, 지역, 업력, 매출, 직원수)을 검토하여 지원 가능 여부를 판단해요.
              하나라도 미충족 시 "지원 불가"로 표시됩니다.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">2단계: 적합도 점수 (총 100점)</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-muted-foreground mb-3">
              <span>• 기술성: 25점</span>
              <span>• 시장성: 20점</span>
              <span>• 사업성: 20점</span>
              <span>• 공고부합도: 25점</span>
              <span>• 가점: 10점</span>
            </div>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>80점 이상: 높은 적합도</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>60-79점: 양호한 적합도</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>40-59점: 보통</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>40점 미만: 낮은 적합도</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

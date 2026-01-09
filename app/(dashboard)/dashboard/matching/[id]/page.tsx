import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Building2, Calendar, ExternalLink, FileText, Trash2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { ScoreGauge } from '@/components/matching/score-gauge'
import { AnalysisCard } from '@/components/matching/analysis-card'
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

      {/* 종합 점수 */}
      <Card>
        <CardHeader>
          <CardTitle>AI 매칭 분석 결과</CardTitle>
          <CardDescription>
            기업 정보를 기반으로 해당 공고와의 적합도를 AI가 분석한 결과입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* 종합 점수 게이지 */}
            <div className="flex-shrink-0">
              <ScoreGauge
                score={analysis.overallScore}
                size="lg"
                label="종합 매칭 점수"
              />
            </div>

            {/* 세부 점수 */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <ScoreGauge
                  score={analysis.technicalScore}
                  maxScore={30}
                  size="sm"
                  showLabel={false}
                />
                <p className="text-sm font-medium mt-2">기술성</p>
                <p className="text-xs text-muted-foreground">{analysis.technicalScore}/30점</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <ScoreGauge
                  score={analysis.marketScore}
                  maxScore={25}
                  size="sm"
                  showLabel={false}
                />
                <p className="text-sm font-medium mt-2">시장성</p>
                <p className="text-xs text-muted-foreground">{analysis.marketScore}/25점</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <ScoreGauge
                  score={analysis.businessScore}
                  maxScore={25}
                  size="sm"
                  showLabel={false}
                />
                <p className="text-sm font-medium mt-2">사업성</p>
                <p className="text-xs text-muted-foreground">{analysis.businessScore}/25점</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <ScoreGauge
                  score={analysis.bonusPoints}
                  maxScore={20}
                  size="sm"
                  showLabel={false}
                />
                <p className="text-sm font-medium mt-2">가점</p>
                <p className="text-xs text-muted-foreground">{analysis.bonusPoints}/20점</p>
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
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}

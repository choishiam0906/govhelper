import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { TrendingUp, Clock, Building2, ArrowRight, Sparkles } from 'lucide-react'
import { checkUsageLimit } from '@/lib/queries/dashboard'
import { MatchingForm } from './matching-form'

interface SearchParams {
  announcementId?: string
}

export default async function MatchingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 기업 정보 조회
  const { data: companyData } = await supabase
    .from('companies')
    .select('id, name')
    .eq('user_id', user!.id)
    .single()

  const company = companyData as { id: string; name: string } | null

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">기업 정보를 먼저 등록해 주세요</p>
        <Button asChild className="mt-4">
          <Link href="/onboarding">기업 정보 등록하기</Link>
        </Button>
      </div>
    )
  }

  // 사용량 체크
  const usage = await checkUsageLimit(supabase, user!.id, company.id, 'matching')

  // 최근 매칭 결과 조회
  const { data: recentMatches } = await supabase
    .from('matches')
    .select(`
      id,
      match_score,
      created_at,
      announcements (
        id,
        title,
        organization,
        application_end,
        source
      )
    `)
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // 선택된 공고가 있으면 조회
  let selectedAnnouncement = null
  if (params.announcementId) {
    const { data } = await supabase
      .from('announcements')
      .select('id, title, organization')
      .eq('id', params.announcementId)
      .single()
    selectedAnnouncement = data
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI 매칭 분석</h1>
        <p className="text-muted-foreground mt-1">
          AI가 우리 기업에 맞는 지원사업인지 분석해요
        </p>
      </div>

      {/* 사용량 표시 */}
      {usage.limit > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant={usage.remaining > 0 ? 'secondary' : 'destructive'}>
            이번 달 {usage.limit - usage.remaining}/{usage.limit}회 사용
          </Badge>
          {usage.remaining === 0 && (
            <Link href="/dashboard/billing" className="text-primary hover:underline">
              Pro로 업그레이드하여 무제한 사용
            </Link>
          )}
        </div>
      )}

      {/* 새 분석 카드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>새 매칭 분석</CardTitle>
          </div>
          <CardDescription>
            공고를 선택하면 AI가 기업 정보를 기반으로 매칭도를 분석합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MatchingForm
            companyId={company.id}
            companyName={company.name}
            selectedAnnouncement={selectedAnnouncement}
            canAnalyze={usage.allowed}
          />
        </CardContent>
      </Card>

      {/* 최근 분석 결과 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>최근 분석 결과</CardTitle>
            <CardDescription>최근 진행한 AI 매칭 분석 결과입니다</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!recentMatches || recentMatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>아직 분석 결과가 없어요</p>
              <p className="text-sm mt-1">공고를 선택하고 분석을 시작해 보세요</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMatches.map((match: any) => (
                <Link
                  key={match.id}
                  href={`/dashboard/matching/${match.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {match.announcements?.title || '삭제된 공고'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {match.announcements?.organization && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {match.announcements.organization}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(match.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {match.match_score}
                          <span className="text-sm font-normal text-muted-foreground">점</span>
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

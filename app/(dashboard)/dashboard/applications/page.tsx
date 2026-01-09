import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText, Clock, Building2, ArrowRight, Plus } from 'lucide-react'

export default async function ApplicationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 지원서 목록 조회
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      content,
      status,
      created_at,
      updated_at,
      matches (
        id,
        match_score,
        announcements (
          id,
          title,
          organization,
          application_end
        )
      )
    `)
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">작성 중</Badge>
      case 'completed':
        return <Badge variant="default">완료</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI 지원서</h1>
          <p className="text-muted-foreground mt-1">
            AI가 작성한 지원서 초안을 관리합니다
          </p>
        </div>
      </div>

      {/* 안내 */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            AI 지원서를 작성하려면 먼저{' '}
            <Link href="/dashboard/matching" className="text-primary hover:underline">
              AI 매칭 분석
            </Link>
            을 진행해주세요. 매칭 결과 페이지에서 지원서 작성을 시작할 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* 지원서 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>내 지원서</CardTitle>
          <CardDescription>작성 중인 지원서와 완료된 지원서 목록입니다</CardDescription>
        </CardHeader>
        <CardContent>
          {!applications || applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>작성된 지원서가 없습니다</p>
              <p className="text-sm mt-1">AI 매칭 후 지원서를 작성해보세요</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/matching">
                  <Plus className="h-4 w-4 mr-2" />
                  매칭 분석 시작
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app: any) => {
                const announcement = app.matches?.announcements
                const contentJson = app.content ? JSON.parse(app.content) : null
                const sectionCount = contentJson?.sections?.length || 0

                return (
                  <Link
                    key={app.id}
                    href={`/dashboard/applications/${app.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">
                            {announcement?.title || '삭제된 공고'}
                          </h3>
                          {getStatusBadge(app.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {announcement?.organization && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {announcement.organization}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {sectionCount}개 섹션
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(app.updated_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        {app.matches?.match_score && (
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              {app.matches.match_score}
                              <span className="text-xs font-normal text-muted-foreground">점</span>
                            </p>
                            <p className="text-xs text-muted-foreground">매칭점수</p>
                          </div>
                        )}
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, FileText, Mail } from 'lucide-react'

export default async function PendingApprovalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 기업 정보 조회
  const { data: companyData } = await supabase
    .from('companies')
    .select('id, name, approval_status, business_plan_url, created_at')
    .eq('user_id', user.id)
    .single()

  const company = companyData as {
    id: string
    name: string
    approval_status: string
    business_plan_url: string | null
    created_at: string
  } | null

  // 승인된 사용자는 대시보드로 리다이렉트
  if (!company || company.approval_status === 'approved') {
    redirect('/dashboard')
  }

  // 거절된 경우
  if (company.approval_status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl">승인이 거절되었어요</CardTitle>
            <CardDescription>
              제출하신 사업계획서 검토 결과, 서비스 이용이 승인되지 않았어요.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              자세한 사항은 고객센터로 문의해 주세요.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>support@govhelpers.com</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 승인 대기 중
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-xl">승인 대기 중이에요</CardTitle>
          <CardDescription>
            제출하신 사업계획서를 검토하고 있어요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">기업명</span>
              <span className="font-medium">{company.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">신청일</span>
              <span className="font-medium">
                {new Date(company.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">상태</span>
              <span className="font-medium text-amber-600">검토 중</span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              승인까지 1-2 영업일이 소요될 수 있어요.
            </p>
            <p className="text-sm text-muted-foreground">
              승인이 완료되면 이메일로 안내해 드릴게요.
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-center text-muted-foreground">
              문의사항이 있으시면{' '}
              <a href="mailto:support@govhelpers.com" className="text-primary hover:underline">
                support@govhelpers.com
              </a>
              으로 연락해 주세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

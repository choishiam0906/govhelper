import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ApprovalActions } from './approval-actions'

interface Company {
  id: string
  name: string
  industry: string | null
  location: string | null
  description: string | null
  business_plan_url: string | null
  approval_status: string
  created_at: string
  user_id: string
  users: {
    email: string
  } | null
}

// 업종 라벨
const industryLabels: Record<string, string> = {
  software: 'SW 개발',
  ai: 'AI/빅데이터',
  biotech: '바이오/의료',
  manufacturing: '제조업',
  commerce: '유통/커머스',
  fintech: '핀테크',
  contents: '콘텐츠/미디어',
  education: '에듀테크',
  energy: '에너지/환경',
  other: '기타',
}

// 지역 라벨
const locationLabels: Record<string, string> = {
  seoul: '서울',
  gyeonggi: '경기',
  incheon: '인천',
  busan: '부산',
  daegu: '대구',
  daejeon: '대전',
  gwangju: '광주',
  ulsan: '울산',
  sejong: '세종',
  gangwon: '강원',
  chungbuk: '충북',
  chungnam: '충남',
  jeonbuk: '전북',
  jeonnam: '전남',
  gyeongbuk: '경북',
  gyeongnam: '경남',
  jeju: '제주',
}

export default async function ApprovalsPage() {
  const supabase = await createClient()

  // 미등록 사업자 목록 조회 (승인 대기 및 거절 포함)
  const { data: pendingCompanies } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      industry,
      location,
      description,
      business_plan_url,
      approval_status,
      created_at,
      user_id
    `)
    .eq('is_registered_business', false)
    .order('created_at', { ascending: false })

  type CompanyData = {
    id: string
    name: string
    industry: string | null
    location: string | null
    description: string | null
    business_plan_url: string | null
    approval_status: string
    created_at: string
    user_id: string
  }

  const rawCompanies = (pendingCompanies || []) as CompanyData[]

  // 사업계획서 서명된 URL 생성
  const companiesWithSignedUrls = await Promise.all(
    rawCompanies.map(async (company) => {
      let signedUrl = null
      if (company.business_plan_url) {
        const { data: signedUrlData } = await supabase.storage
          .from('business-plans')
          .createSignedUrl(company.business_plan_url, 3600) // 1시간 유효
        signedUrl = signedUrlData?.signedUrl || null
      }
      return {
        ...company,
        business_plan_url: signedUrl, // 서명된 URL로 교체
        users: null,
      }
    })
  )

  const companies: Company[] = companiesWithSignedUrls

  const pendingCount = companies.filter(c => c.approval_status === 'pending').length
  const approvedCount = companies.filter(c => c.approval_status === 'approved').length
  const rejectedCount = companies.filter(c => c.approval_status === 'rejected').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">승인 관리</h1>
        <p className="text-muted-foreground mt-1">
          미등록 사업자의 승인 요청을 관리합니다
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">승인 대기</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-sm text-muted-foreground">승인됨</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-sm text-muted-foreground">거절됨</p>
          </CardContent>
        </Card>
      </div>

      {/* 승인 대기 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>승인 요청 목록</CardTitle>
          <CardDescription>미등록 사업자의 승인 요청 목록입니다</CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              승인 요청이 없어요
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{company.name}</h3>
                        <Badge
                          variant={
                            company.approval_status === 'pending'
                              ? 'secondary'
                              : company.approval_status === 'approved'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {company.approval_status === 'pending'
                            ? '대기 중'
                            : company.approval_status === 'approved'
                            ? '승인됨'
                            : '거절됨'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {company.users?.email || '이메일 없음'}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(company.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {company.industry && (
                      <div>
                        <span className="text-muted-foreground">업종: </span>
                        <span>{industryLabels[company.industry] || company.industry}</span>
                      </div>
                    )}
                    {company.location && (
                      <div>
                        <span className="text-muted-foreground">지역: </span>
                        <span>{locationLabels[company.location] || company.location}</span>
                      </div>
                    )}
                  </div>

                  {company.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {company.description}
                    </p>
                  )}

                  <ApprovalActions
                    companyId={company.id}
                    currentStatus={company.approval_status}
                    businessPlanUrl={company.business_plan_url}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

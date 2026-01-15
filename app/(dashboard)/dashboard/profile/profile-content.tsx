'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { CompanyForm } from '@/components/forms/company-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, Mail, Calendar, Pencil } from 'lucide-react'
import { NotificationSettings } from '@/components/notifications/notification-settings'

interface Company {
  id: string
  name: string
  business_number: string | null
  industry: string | null
  employee_count: number | null
  founded_date: string | null
  location: string | null
  certifications: string[] | null
  annual_revenue: number | null
  description: string | null
  created_at: string
  updated_at: string
}

interface ProfileContentProps {
  user: User
  company: Company | null
}

// 인증 라벨
const certificationLabels: Record<string, string> = {
  venture: '벤처기업',
  innobiz: '이노비즈',
  mainbiz: '메인비즈',
  womanEnterprise: '여성기업',
  socialEnterprise: '사회적기업',
  researchInstitute: '기업부설연구소',
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

export function ProfileContent({ user, company }: ProfileContentProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)

  const handleEditSuccess = () => {
    setIsEditing(false)
    router.refresh()
  }

  if (!company) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              기업 정보 등록
            </CardTitle>
            <CardDescription>
              아직 등록된 기업 정보가 없습니다. 정부지원사업 매칭을 위해 기업 정보를 등록해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyForm onSuccess={() => router.refresh()} mode="create" />
          </CardContent>
        </Card>

        {/* 알림 설정 */}
        <NotificationSettings userEmail={user.email || ''} />
      </div>
    )
  }

  if (isEditing) {
    // null 값을 undefined로 변환
    const formData = {
      id: company.id,
      name: company.name,
      business_number: company.business_number ?? undefined,
      industry: company.industry ?? undefined,
      employee_count: company.employee_count ?? undefined,
      founded_date: company.founded_date ?? undefined,
      location: company.location ?? undefined,
      certifications: company.certifications ?? undefined,
      annual_revenue: company.annual_revenue ?? undefined,
      description: company.description ?? undefined,
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">기업 정보 수정</h1>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            취소
          </Button>
        </div>
        <CompanyForm
          initialData={formData}
          onSuccess={handleEditSuccess}
          mode="edit"
        />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 계정 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">이메일</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">가입일</p>
              <p className="font-medium">
                {new Date(user.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 기업 정보 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {company.name}
            </CardTitle>
            <CardDescription>
              {company.industry && industryLabels[company.industry]}
              {company.location && ` | ${locationLabels[company.location]}`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            수정
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {company.business_number && (
              <div>
                <p className="text-sm text-muted-foreground">사업자등록번호</p>
                <p className="font-medium">{company.business_number}</p>
              </div>
            )}
            {company.founded_date && (
              <div>
                <p className="text-sm text-muted-foreground">설립일</p>
                <p className="font-medium">
                  {new Date(company.founded_date).toLocaleDateString('ko-KR')}
                </p>
              </div>
            )}
            {company.employee_count && (
              <div>
                <p className="text-sm text-muted-foreground">직원 수</p>
                <p className="font-medium">{company.employee_count}명</p>
              </div>
            )}
            {company.annual_revenue && (
              <div>
                <p className="text-sm text-muted-foreground">연 매출</p>
                <p className="font-medium">
                  {(company.annual_revenue / 10000).toLocaleString()}억원
                </p>
              </div>
            )}
          </div>

          {/* 보유 인증 */}
          {company.certifications && company.certifications.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">보유 인증</p>
              <div className="flex flex-wrap gap-2">
                {company.certifications.map((cert) => (
                  <Badge key={cert} variant="secondary">
                    {certificationLabels[cert] || cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 기업 소개 */}
          {company.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">기업 소개</p>
              <p className="text-sm leading-relaxed">{company.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <NotificationSettings userEmail={user.email || ''} />
    </div>
  )
}

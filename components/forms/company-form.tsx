'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle, Search } from 'lucide-react'

// 사업자 검증 결과 타입
interface BusinessVerifyResult {
  businessNumber: string
  isValid: boolean
  status?: string
  statusCode?: string
  taxType?: string
  taxTypeCode?: string
  closedDate?: string | null
}

// 유효성 검사 스키마
const companyFormSchema = z.object({
  name: z.string().min(1, '기업명을 입력해주세요'),
  businessNumber: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z.string().optional(),
  foundedDate: z.string().optional(),
  location: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  annualRevenue: z.string().optional(),
  description: z.string().optional(),
})

type CompanyFormData = z.infer<typeof companyFormSchema>

// 업종 목록
const industries = [
  { value: 'software', label: 'SW 개발' },
  { value: 'ai', label: 'AI/빅데이터' },
  { value: 'biotech', label: '바이오/의료' },
  { value: 'manufacturing', label: '제조업' },
  { value: 'commerce', label: '유통/커머스' },
  { value: 'fintech', label: '핀테크' },
  { value: 'contents', label: '콘텐츠/미디어' },
  { value: 'education', label: '에듀테크' },
  { value: 'energy', label: '에너지/환경' },
  { value: 'other', label: '기타' },
]

// 지역 목록
const locations = [
  { value: 'seoul', label: '서울' },
  { value: 'gyeonggi', label: '경기' },
  { value: 'incheon', label: '인천' },
  { value: 'busan', label: '부산' },
  { value: 'daegu', label: '대구' },
  { value: 'daejeon', label: '대전' },
  { value: 'gwangju', label: '광주' },
  { value: 'ulsan', label: '울산' },
  { value: 'sejong', label: '세종' },
  { value: 'gangwon', label: '강원' },
  { value: 'chungbuk', label: '충북' },
  { value: 'chungnam', label: '충남' },
  { value: 'jeonbuk', label: '전북' },
  { value: 'jeonnam', label: '전남' },
  { value: 'gyeongbuk', label: '경북' },
  { value: 'gyeongnam', label: '경남' },
  { value: 'jeju', label: '제주' },
]

// 인증 목록
const certificationOptions = [
  { value: 'venture', label: '벤처기업' },
  { value: 'innobiz', label: '이노비즈' },
  { value: 'mainbiz', label: '메인비즈' },
  { value: 'womanEnterprise', label: '여성기업' },
  { value: 'socialEnterprise', label: '사회적기업' },
  { value: 'researchInstitute', label: '기업부설연구소' },
]

interface CompanyFormProps {
  initialData?: {
    id?: string
    name?: string
    business_number?: string
    industry?: string
    employee_count?: number
    founded_date?: string
    location?: string
    certifications?: string[]
    annual_revenue?: number
    description?: string
  }
  onSuccess?: () => void
  mode?: 'create' | 'edit'
}

export function CompanyForm({ initialData, onSuccess, mode = 'create' }: CompanyFormProps) {
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<BusinessVerifyResult | null>(null)
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>(
    initialData?.certifications || []
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      businessNumber: initialData?.business_number || '',
      industry: initialData?.industry || '',
      employeeCount: initialData?.employee_count?.toString() || '',
      foundedDate: initialData?.founded_date || '',
      location: initialData?.location || '',
      certifications: initialData?.certifications || [],
      annualRevenue: initialData?.annual_revenue?.toString() || '',
      description: initialData?.description || '',
    },
  })

  const toggleCertification = (value: string) => {
    const updated = selectedCertifications.includes(value)
      ? selectedCertifications.filter((c) => c !== value)
      : [...selectedCertifications, value]
    setSelectedCertifications(updated)
    setValue('certifications', updated)
  }

  // 사업자번호 검증
  const verifyBusinessNumber = async () => {
    const businessNumber = watch('businessNumber')
    if (!businessNumber || businessNumber.replace(/[^0-9]/g, '').length < 10) {
      toast.error('사업자번호 10자리를 입력해 주세요')
      return
    }

    setVerifying(true)
    setVerifyResult(null)

    try {
      const response = await fetch('/api/business/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessNumber }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        setVerifyResult(result.data)
        if (result.data.isValid) {
          if (result.data.statusCode === '03') {
            toast.warning('폐업한 사업자예요')
          } else if (result.data.statusCode === '02') {
            toast.warning('휴업 중인 사업자예요')
          } else {
            toast.success('유효한 사업자번호예요')
          }
        }
      } else {
        setVerifyResult({ businessNumber, isValid: false })
        toast.error(result.error || '사업자번호를 확인할 수 없어요')
      }
    } catch (error) {
      toast.error('검증 중 오류가 발생했어요')
    } finally {
      setVerifying(false)
    }
  }

  const onSubmit = async (data: CompanyFormData) => {
    setLoading(true)
    try {
      const payload = {
        name: data.name,
        businessNumber: data.businessNumber || null,
        industry: data.industry || null,
        employeeCount: data.employeeCount ? parseInt(data.employeeCount) : null,
        foundedDate: data.foundedDate || null,
        location: data.location || null,
        certifications: selectedCertifications.length > 0 ? selectedCertifications : null,
        annualRevenue: data.annualRevenue ? parseInt(data.annualRevenue.replace(/,/g, '')) : null,
        description: data.description || null,
      }

      const url = mode === 'edit' && initialData?.id
        ? `/api/companies/${initialData.id}`
        : '/api/companies'

      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '저장하지 못했어요')
      }

      toast.success(mode === 'edit' ? '기업 정보를 수정했어요' : '기업 정보를 등록했어요')
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '문제가 생겼어요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>기업의 기본 정보를 입력해 주세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 기업명 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              기업명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="기업명"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* 사업자등록번호 */}
          <div className="space-y-2">
            <Label htmlFor="businessNumber">사업자등록번호</Label>
            <div className="flex gap-2">
              <Input
                id="businessNumber"
                placeholder="000-00-00000"
                {...register('businessNumber')}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={verifyBusinessNumber}
                disabled={verifying}
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-1">조회</span>
              </Button>
            </div>
            {verifyResult && (
              <div className="flex items-center gap-2 mt-2">
                {verifyResult.isValid ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      {verifyResult.status}
                    </span>
                    {verifyResult.taxType && (
                      <Badge variant="outline" className="text-xs">
                        {verifyResult.taxType}
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-500">
                      등록되지 않은 사업자번호
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 업종 */}
          <div className="space-y-2">
            <Label>업종</Label>
            <Select
              value={watch('industry') || ''}
              onValueChange={(value) => setValue('industry', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="업종 선택" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>
                    {industry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 설립일 & 직원수 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="foundedDate">설립일</Label>
              <Input
                id="foundedDate"
                type="date"
                {...register('foundedDate')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeCount">직원 수</Label>
              <Input
                id="employeeCount"
                type="number"
                placeholder="0"
                {...register('employeeCount')}
              />
            </div>
          </div>

          {/* 소재지 */}
          <div className="space-y-2">
            <Label>소재지</Label>
            <Select
              value={watch('location') || ''}
              onValueChange={(value) => setValue('location', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="지역 선택" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.value} value={location.value}>
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 연 매출 */}
          <div className="space-y-2">
            <Label htmlFor="annualRevenue">연 매출 (만원)</Label>
            <Input
              id="annualRevenue"
              type="text"
              placeholder="예: 50000 (5억원)"
              {...register('annualRevenue')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>보유 인증</CardTitle>
          <CardDescription>보유하고 있는 인증을 선택해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {certificationOptions.map((cert) => (
              <button
                key={cert.value}
                type="button"
                onClick={() => toggleCertification(cert.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCertifications.includes(cert.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {cert.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>기업 소개</CardTitle>
          <CardDescription>기업에 대한 간단한 소개를 작성해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[120px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="주요 사업 내용, 핵심 기술, 비전 등을 작성해주세요"
            {...register('description')}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'edit' ? '정보 수정' : '기업 등록'}
        </Button>
      </div>
    </form>
  )
}

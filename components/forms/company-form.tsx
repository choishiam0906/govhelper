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

// 통합 기업정보 조회 결과 타입
interface UnifiedBusinessInfo {
  businessNumber: string
  companyName: string | null
  companyNameEng: string | null
  ceoName: string | null
  address: string | null
  location: string | null
  industryCode: string | null
  employeeCount: number | null
  establishedDate: string | null
  businessType: string | null
  industryName: string | null
  companySize: string | null
  corporationType: string | null
  homepage: string | null
  phone: string | null
  ntsStatus: string | null
  ntsStatusCode: string | null
  taxType: string | null
  taxTypeCode: string | null
  closedDate: string | null
  stockCode: string | null
  stockMarket: string | null
  sources: string[]
}

interface BusinessLookupResult {
  success: boolean
  data: UnifiedBusinessInfo | null
  error?: string
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

// 지역명 → 영문 코드 매핑
const locationMapping: Record<string, string> = {
  '서울특별시': 'seoul',
  '서울': 'seoul',
  '경기도': 'gyeonggi',
  '경기': 'gyeonggi',
  '인천광역시': 'incheon',
  '인천': 'incheon',
  '부산광역시': 'busan',
  '부산': 'busan',
  '대구광역시': 'daegu',
  '대구': 'daegu',
  '대전광역시': 'daejeon',
  '대전': 'daejeon',
  '광주광역시': 'gwangju',
  '광주': 'gwangju',
  '울산광역시': 'ulsan',
  '울산': 'ulsan',
  '세종특별자치시': 'sejong',
  '세종': 'sejong',
  '강원도': 'gangwon',
  '강원': 'gangwon',
  '충청북도': 'chungbuk',
  '충북': 'chungbuk',
  '충청남도': 'chungnam',
  '충남': 'chungnam',
  '전라북도': 'jeonbuk',
  '전북': 'jeonbuk',
  '전라남도': 'jeonnam',
  '전남': 'jeonnam',
  '경상북도': 'gyeongbuk',
  '경북': 'gyeongbuk',
  '경상남도': 'gyeongnam',
  '경남': 'gyeongnam',
  '제주특별자치도': 'jeju',
  '제주': 'jeju',
}

// 업종(KSIC 대분류) → 영문 코드 매핑
const industryMapping: Record<string, string> = {
  '정보통신업': 'software',
  '출판업': 'software',
  '컴퓨터 프로그래밍, 시스템 통합 및 관리업': 'software',
  '정보서비스업': 'ai',
  '제조업': 'manufacturing',
  '전자부품, 컴퓨터, 영상, 음향 및 통신장비 제조업': 'manufacturing',
  '금융 및 보험업': 'fintech',
  '보건업 및 사회복지 서비스업': 'biotech',
  '도매 및 소매업': 'commerce',
  '교육 서비스업': 'education',
  '영상ㆍ오디오 기록물 제작 및 배급업': 'contents',
  '방송업': 'contents',
  '예술, 스포츠 및 여가관련 서비스업': 'contents',
  '전기, 가스, 증기 및 공기 조절 공급업': 'energy',
  '수도, 하수 및 폐기물 처리, 원료 재생업': 'energy',
}

// 지역명에서 매핑된 코드 찾기
function getLocationCode(location: string | null): string | null {
  if (!location) return null
  if (locationMapping[location]) return locationMapping[location]
  for (const [key, value] of Object.entries(locationMapping)) {
    if (location.includes(key) || key.includes(location)) {
      return value
    }
  }
  return null
}

// 업종명에서 매핑된 코드 찾기
function getIndustryCode(businessType: string | null, industryName: string | null): string | null {
  if (industryName && industryMapping[industryName]) {
    return industryMapping[industryName]
  }
  if (businessType && industryMapping[businessType]) {
    return industryMapping[businessType]
  }
  return null
}

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
  const [lookupResult, setLookupResult] = useState<UnifiedBusinessInfo | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
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

  // 사업자번호 조회 및 자동 입력
  const verifyBusinessNumber = async () => {
    const businessNumber = watch('businessNumber')
    if (!businessNumber || businessNumber.replace(/[^0-9]/g, '').length < 10) {
      toast.error('사업자번호 10자리를 입력해 주세요')
      return
    }

    setVerifying(true)
    setLookupResult(null)
    setLookupError(null)

    try {
      const response = await fetch('/api/business/unified-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessNumber }),
      })

      const result: BusinessLookupResult = await response.json()

      if (result.success && result.data) {
        setLookupResult(result.data)

        // 사업자 상태 확인
        if (result.data.ntsStatusCode === '03') {
          toast.warning('폐업한 사업자예요')
        } else if (result.data.ntsStatusCode === '02') {
          toast.warning('휴업 중인 사업자예요')
        } else {
          toast.success('기업 정보를 자동으로 입력했어요')
        }

        // 기업명 자동 입력
        if (result.data.companyName) {
          setValue('name', result.data.companyName)
        }

        // 직원수 자동 입력
        if (result.data.employeeCount) {
          setValue('employeeCount', String(result.data.employeeCount))
        }

        // 설립일 자동 입력
        if (result.data.establishedDate) {
          const dateStr = result.data.establishedDate.replace(/[^0-9]/g, '')
          if (dateStr.length === 8) {
            const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
            setValue('foundedDate', formatted)
          }
        }

        // 지역 자동 입력
        const locationCode = getLocationCode(result.data.location)
        if (locationCode) {
          setValue('location', locationCode)
        }

        // 업종 자동 입력
        const industryCode = getIndustryCode(result.data.businessType, result.data.industryName)
        if (industryCode) {
          setValue('industry', industryCode)
        }
      } else {
        setLookupError(result.error || '기업 정보를 찾을 수 없어요')
        toast.error(result.error || '기업 정보를 찾을 수 없어요')
      }
    } catch {
      setLookupError('조회 중 오류가 발생했어요')
      toast.error('조회 중 오류가 발생했어요')
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
            {lookupResult && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {lookupResult.companyName || '기업 정보 확인됨'}
                  </span>
                  {lookupResult.corporationType && lookupResult.corporationType !== '알 수 없음' && (
                    <Badge variant="outline" className="text-xs bg-white">
                      {lookupResult.corporationType}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                  {lookupResult.ceoName && (
                    <div>대표자: {lookupResult.ceoName}</div>
                  )}
                  {lookupResult.businessType && (
                    <div>업태: {lookupResult.businessType}</div>
                  )}
                  {lookupResult.industryName && (
                    <div>종목: {lookupResult.industryName}</div>
                  )}
                  {lookupResult.companySize && lookupResult.companySize !== '알 수 없음' && (
                    <div>규모: {lookupResult.companySize}</div>
                  )}
                  {lookupResult.ntsStatus && (
                    <div>상태: {lookupResult.ntsStatus}</div>
                  )}
                  {lookupResult.taxType && (
                    <div>과세유형: {lookupResult.taxType}</div>
                  )}
                </div>
                {lookupResult.sources && lookupResult.sources.length > 0 && (
                  <div className="flex items-center gap-1 pt-1 border-t border-green-200">
                    <span className="text-xs text-green-600">출처:</span>
                    {lookupResult.sources.map((source) => (
                      <Badge key={source} variant="secondary" className="text-xs">
                        {source.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            {lookupError && (
              <div className="flex items-center gap-2 mt-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">
                  {lookupError}
                </span>
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

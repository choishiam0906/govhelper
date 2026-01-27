'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// 분할된 컴포넌트 임포트
import { CompanyFormBasic } from './CompanyFormBasic'
import { CompanyFormDetails } from './CompanyFormDetails'
import { CompanyFormCertifications } from './CompanyFormCertifications'

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
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>기업의 기본 정보를 입력해 주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyFormBasic
            register={register}
            errors={errors}
            watch={watch}
            verifying={verifying}
            lookupResult={lookupResult}
            lookupError={lookupError}
            onVerify={verifyBusinessNumber}
          />
        </CardContent>
      </Card>

      {/* 상세 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>상세 정보</CardTitle>
          <CardDescription>업종, 직원수, 소재지 등을 입력해 주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyFormDetails
            register={register}
            setValue={setValue}
            watch={watch}
          />
        </CardContent>
      </Card>

      {/* 보유 인증 */}
      <Card>
        <CardHeader>
          <CardTitle>보유 인증</CardTitle>
          <CardDescription>보유하고 있는 인증을 선택해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyFormCertifications
            selectedCertifications={selectedCertifications}
            onToggle={toggleCertification}
          />
        </CardContent>
      </Card>

      {/* 제출 버튼 */}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'edit' ? '정보 수정' : '기업 등록'}
        </Button>
      </div>
    </form>
  )
}

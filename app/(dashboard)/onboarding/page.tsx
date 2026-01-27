'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Sparkles, Upload, FileText, Loader2, CheckCircle, XCircle, Search, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { FUNNEL_EVENTS, trackFunnelEvent } from '@/lib/analytics/events'

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

// 폼 스키마
const onboardingSchema = z.object({
  name: z.string().min(1, '기업명을 입력해주세요'),
  isRegisteredBusiness: z.boolean(),
  businessNumber: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z.string().optional(),
  foundedDate: z.string().optional(),
  location: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  annualRevenue: z.string().optional(),
  description: z.string().optional(),
  businessPlanUrl: z.string().optional(),
})

type OnboardingFormData = z.infer<typeof onboardingSchema>

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
  // 정보통신업 계열
  '정보통신업': 'software',
  '출판업': 'software',
  '컴퓨터 프로그래밍, 시스템 통합 및 관리업': 'software',
  '정보서비스업': 'ai',
  // 제조업 계열
  '제조업': 'manufacturing',
  '전자부품, 컴퓨터, 영상, 음향 및 통신장비 제조업': 'manufacturing',
  // 금융업 계열
  '금융 및 보험업': 'fintech',
  // 바이오/의료 계열
  '보건업 및 사회복지 서비스업': 'biotech',
  // 유통/커머스
  '도매 및 소매업': 'commerce',
  // 교육
  '교육 서비스업': 'education',
  // 콘텐츠/미디어
  '영상ㆍ오디오 기록물 제작 및 배급업': 'contents',
  '방송업': 'contents',
  '예술, 스포츠 및 여가관련 서비스업': 'contents',
  // 에너지/환경
  '전기, 가스, 증기 및 공기 조절 공급업': 'energy',
  '수도, 하수 및 폐기물 처리, 원료 재생업': 'energy',
}

// 지역명에서 매핑된 코드 찾기
function getLocationCode(location: string | null): string | null {
  if (!location) return null
  // 정확히 매칭되는 경우
  if (locationMapping[location]) return locationMapping[location]
  // 부분 문자열 매칭 시도
  for (const [key, value] of Object.entries(locationMapping)) {
    if (location.includes(key) || key.includes(location)) {
      return value
    }
  }
  return null
}

// 업종명에서 매핑된 코드 찾기
function getIndustryCode(businessType: string | null, industryName: string | null): string | null {
  // 먼저 industryName으로 시도
  if (industryName && industryMapping[industryName]) {
    return industryMapping[industryName]
  }
  // businessType으로 시도
  if (businessType && industryMapping[businessType]) {
    return industryMapping[businessType]
  }
  return null
}

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [lookupResult, setLookupResult] = useState<UnifiedBusinessInfo | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([])
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // 온보딩 시작 이벤트
    trackFunnelEvent(FUNNEL_EVENTS.ONBOARDING_START, {
      page_title: '기업 정보 등록',
    })
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: '',
      isRegisteredBusiness: true,
      businessNumber: '',
      industry: '',
      employeeCount: '',
      foundedDate: '',
      location: '',
      certifications: [],
      annualRevenue: '',
      description: '',
      businessPlanUrl: '',
    },
  })

  const isRegistered = watch('isRegisteredBusiness')

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

  // 파일 업로드
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('PDF 파일만 업로드할 수 있어요')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 10MB 이하여야 해요')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/business-plan', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setUploadedFile({ name: file.name, url: result.data.url })
        setValue('businessPlanUrl', result.data.url)
        toast.success('사업계획서를 업로드했어요')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '업로드에 실패했어요')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: OnboardingFormData) => {
    // 미등록 사업자는 사업계획서 필수
    if (!data.isRegisteredBusiness && !uploadedFile) {
      toast.error('사업계획서를 업로드해 주세요')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: data.name,
        isRegisteredBusiness: data.isRegisteredBusiness,
        businessNumber: data.isRegisteredBusiness ? data.businessNumber || null : null,
        industry: data.industry || null,
        employeeCount: data.employeeCount ? parseInt(data.employeeCount) : null,
        foundedDate: data.foundedDate || null,
        location: data.location || null,
        certifications: data.isRegisteredBusiness && selectedCertifications.length > 0 ? selectedCertifications : null,
        annualRevenue: data.annualRevenue ? parseInt(data.annualRevenue.replace(/,/g, '')) : null,
        description: data.description || null,
        businessPlanUrl: !data.isRegisteredBusiness ? uploadedFile?.url : null,
      }

      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '저장하지 못했어요')
      }

      // 온보딩 완료 이벤트
      trackFunnelEvent(FUNNEL_EVENTS.ONBOARDING_COMPLETE, {
        has_business_number: !!data.businessNumber,
        is_registered: data.isRegisteredBusiness,
        requires_approval: result.requiresApproval,
      })

      toast.success(result.message)

      // 승인 필요 여부에 따라 다른 페이지로 이동
      if (result.requiresApproval) {
        router.push('/dashboard/pending-approval')
      } else {
        router.refresh()
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 100)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '문제가 생겼어요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">환영해요!</h1>
          <p className="text-muted-foreground text-lg">
            기업 정보를 등록하면 맞춤 정부지원사업을 찾아드려요
          </p>
        </div>

        {/* 안내 배너 */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-primary">AI가 최적의 지원사업을 찾아드립니다</p>
            <p className="text-sm text-muted-foreground mt-1">
              입력한 기업 정보를 바탕으로 적합한 정부지원사업을 매칭해 드려요.
              정보가 상세할수록 더 정확한 추천을 받을 수 있어요.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 사업자 등록 여부 */}
          <Card>
            <CardHeader>
              <CardTitle>사업자 등록 여부</CardTitle>
              <CardDescription>사업자등록증 보유 여부를 선택해 주세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRegistered"
                  checked={isRegistered}
                  onCheckedChange={(checked) => setValue('isRegisteredBusiness', checked === true)}
                />
                <label
                  htmlFor="isRegistered"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  사업자등록증을 보유하고 있어요
                </label>
              </div>
              {!isRegistered && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">미등록 사업자 안내</p>
                    <p className="text-sm text-amber-700 mt-1">
                      사업자등록증이 없는 경우, 사업계획서를 제출하시면 관리자 검토 후 서비스를 이용할 수 있어요.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 기본 정보 */}
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

              {/* 사업자등록번호 - 등록 사업자만 */}
              {isRegistered && (
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
              )}

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

          {/* 보유 인증 - 등록 사업자만 */}
          {isRegistered && (
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
          )}

          {/* 사업계획서 업로드 - 미등록 사업자만 */}
          {!isRegistered && (
            <Card>
              <CardHeader>
                <CardTitle>
                  사업계획서 <span className="text-red-500">*</span>
                </CardTitle>
                <CardDescription>
                  사업 내용을 검토할 수 있는 사업계획서를 PDF로 업로드해 주세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {uploadedFile ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{uploadedFile.name}</p>
                        <p className="text-sm text-green-600">업로드 완료</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null)
                        setValue('businessPlanUrl', '')
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">업로드 중...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="font-medium">클릭하여 파일 업로드</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          PDF 파일, 최대 10MB
                        </p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 기업 소개 */}
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
              {isRegistered ? '기업 등록' : '승인 요청'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

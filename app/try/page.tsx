'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Building2,
  Users,
  MapPin,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Sparkles,
  Search,
  FileText,
  Shield,
  Database,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useUTM } from '@/lib/hooks/use-utm'

// 업종 목록
const INDUSTRIES = [
  '정보통신업',
  '제조업',
  '도매 및 소매업',
  '건설업',
  '전문, 과학 및 기술 서비스업',
  '교육 서비스업',
  '금융 및 보험업',
  '보건업 및 사회복지 서비스업',
  '숙박 및 음식점업',
  '운수 및 창고업',
  '농업, 임업 및 어업',
  '예술, 스포츠 및 여가관련 서비스업',
  '부동산업',
  '기타',
]

// 지역 목록
const LOCATIONS = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
]

// 인증서 목록
const CERTIFICATIONS = [
  '벤처기업인증',
  '이노비즈인증',
  '메인비즈인증',
  '기술혁신형 중소기업',
  '여성기업인증',
  '장애인기업인증',
  '사회적기업인증',
  '녹색인증',
]

// 직원수 범위 → 중간값 변환
const EMPLOYEE_RANGE_MAP: Record<string, string> = {
  '1-4명': '3',
  '5-9명': '7',
  '10-19명': '15',
  '20-49명': '35',
  '50-99명': '75',
  '100-299명': '200',
  '300명 이상': '500',
}

type Step = 1 | 2 | 3 | 4

interface FormData {
  businessNumber: string
  companyName: string
  industry: string
  employeeCount: string
  location: string
  annualRevenue: string
  foundedDate: string
  certifications: string[]
  email: string
}

// 조회 결과 타입
interface LookupResult {
  found: boolean
  companyName?: string
  address?: string
  location?: string
  subscriberCount?: number
  employeeRange?: string
  ntsStatus?: string
  taxType?: string
  dataYearMonth?: string
}

export default function TryPage() {
  const router = useRouter()
  const { utmForAPI } = useUTM()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [skipBusinessNumber, setSkipBusinessNumber] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    businessNumber: '',
    companyName: '',
    industry: '',
    employeeCount: '',
    location: '',
    annualRevenue: '',
    foundedDate: '',
    certifications: [],
    email: '',
  })

  // 사업자번호 조회 결과
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const progress = ((step - 1) / 3) * 100

  const updateFormData = (key: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const toggleCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }))
  }

  // 사업자번호 조회 (debounce)
  const lookupBusinessNumber = useCallback(async (bizNum: string) => {
    const cleaned = bizNum.replace(/[^0-9]/g, '')

    if (cleaned.length !== 10) {
      setLookupResult(null)
      setLookupError(null)
      return
    }

    setLookingUp(true)
    setLookupError(null)

    try {
      const response = await fetch('/api/business/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessNumber: cleaned }),
      })

      const result = await response.json()

      if (result.success && result.data?.found) {
        setLookupResult(result.data)

        // 폼 자동 채우기
        if (result.data.companyName) {
          updateFormData('companyName', result.data.companyName)
        }
        if (result.data.location) {
          updateFormData('location', result.data.location)
        }
        if (result.data.employeeRange && EMPLOYEE_RANGE_MAP[result.data.employeeRange]) {
          updateFormData('employeeCount', EMPLOYEE_RANGE_MAP[result.data.employeeRange])
        }

        toast.success('사업자 정보를 찾았어요!')
      } else {
        setLookupResult({ found: false })
        setLookupError(result.error || '등록되지 않은 사업자번호예요')
      }
    } catch (error) {
      console.error('Business lookup error:', error)
      setLookupError('조회 중 오류가 발생했어요')
    } finally {
      setLookingUp(false)
    }
  }, [])

  // 사업자번호 입력 시 debounce 조회
  useEffect(() => {
    const bizNum = formData.businessNumber.replace(/[^0-9]/g, '')

    if (bizNum.length === 10) {
      const timer = setTimeout(() => {
        lookupBusinessNumber(formData.businessNumber)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setLookupResult(null)
      setLookupError(null)
    }
  }, [formData.businessNumber, lookupBusinessNumber])

  // 1단계 → 2단계
  const handleStep1Next = () => {
    const bizNum = formData.businessNumber.replace(/[^0-9]/g, '')

    if (bizNum.length > 0 && bizNum.length !== 10) {
      toast.error('사업자번호 10자리를 입력해주세요')
      return
    }

    setStep(2)
  }

  // 사업자번호 없이 진행
  const handleSkipBusinessNumber = () => {
    setSkipBusinessNumber(true)
    setLookupResult(null)
    setStep(2)
  }

  // 2단계 → 3단계
  const handleStep2Next = () => {
    if (!formData.companyName.trim()) {
      toast.error('회사명을 입력해주세요')
      return
    }
    if (!formData.industry) {
      toast.error('업종을 선택해주세요')
      return
    }
    if (!formData.employeeCount) {
      toast.error('직원수를 입력해주세요')
      return
    }
    if (!formData.location) {
      toast.error('소재지를 선택해주세요')
      return
    }
    setStep(3)
  }

  // 최종 제출
  const handleSubmit = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      toast.error('올바른 이메일을 입력해주세요')
      return
    }

    setStep(4)
    setLoading(true)

    try {
      const response = await fetch('/api/guest/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          businessNumber: skipBusinessNumber ? undefined : formData.businessNumber.replace(/[^0-9]/g, ''),
          companyName: formData.companyName,
          industry: formData.industry,
          employeeCount: parseInt(formData.employeeCount) || 1,
          location: formData.location,
          annualRevenue: formData.annualRevenue ? parseInt(formData.annualRevenue) * 100000000 : undefined,
          foundedDate: formData.foundedDate || undefined,
          certifications: formData.certifications.length > 0 ? formData.certifications : undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        router.push(`/try/result/${result.data.resultId}`)
      } else {
        toast.error(result.error || '분석 중 오류가 발생했어요')
        setStep(3)
        setLoading(false)
      }
    } catch (error) {
      toast.error('분석 요청 중 오류가 발생했어요')
      setStep(3)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* 헤더 */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            정부지원사업도우미
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">로그인</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 진행률 */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>무료 매칭 분석</span>
            <span>{step}/4 단계</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          {/* 1단계: 사업자번호 입력 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">사업자번호를 입력해주세요</CardTitle>
                  <CardDescription>
                    사업자번호만 입력하면 기업 정보를 자동으로 채워드려요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 사업자번호 */}
                  <div className="space-y-2">
                    <Label htmlFor="businessNumber">사업자번호</Label>
                    <div className="relative">
                      <Input
                        id="businessNumber"
                        placeholder="000-00-00000"
                        value={formData.businessNumber}
                        onChange={(e) => updateFormData('businessNumber', e.target.value)}
                        className="text-lg pr-10"
                      />
                      {lookingUp && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      하이픈(-) 없이 숫자만 입력해도 돼요
                    </p>
                  </div>

                  {/* 조회 결과 표시 */}
                  {lookupResult && lookupResult.found && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-700">사업자 정보를 찾았어요!</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{lookupResult.companyName}</span>
                        </div>
                        {lookupResult.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                            <span className="text-muted-foreground">{lookupResult.address}</span>
                          </div>
                        )}
                        {lookupResult.employeeRange && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground">
                              국민연금 가입자 약 {lookupResult.subscriberCount}명 ({lookupResult.employeeRange})
                            </span>
                          </div>
                        )}
                        {lookupResult.ntsStatus && (
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground">
                              {lookupResult.ntsStatus} · {lookupResult.taxType}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Database className="h-3 w-3" />
                        <span>국민연금 데이터 기준 ({lookupResult.dataYearMonth})</span>
                      </div>
                    </motion.div>
                  )}

                  {/* 조회 실패 */}
                  {lookupResult && !lookupResult.found && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <span className="text-amber-700">{lookupError}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        기업 정보를 직접 입력해주세요
                      </p>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleStep1Next}
                    disabled={lookingUp}
                    className="w-full"
                    size="lg"
                  >
                    {lookupResult?.found ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        정보 확인하고 계속하기
                      </>
                    ) : (
                      <>
                        다음 단계로
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">또는</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSkipBusinessNumber}
                  >
                    사업자번호 없이 진행하기
                  </Button>

                  <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                    <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      입력하신 정보는 매칭 분석에만 사용되며, 안전하게 보호돼요.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 2단계: 기업정보 입력 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">기업 정보를 확인해주세요</CardTitle>
                  <CardDescription>
                    {lookupResult?.found
                      ? '자동으로 채워진 정보를 확인하고 수정해주세요'
                      : '더 정확한 매칭을 위해 기업 정보가 필요해요'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 자동 입력 안내 */}
                  {lookupResult?.found && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-700">
                          사업자 정보로 자동 입력됨
                        </p>
                        <p className="text-xs text-muted-foreground">
                          필요시 수정할 수 있어요
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        국민연금 데이터
                      </Badge>
                    </div>
                  )}

                  {/* 회사명 */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName">회사명 *</Label>
                    <Input
                      id="companyName"
                      placeholder="(주)회사명"
                      value={formData.companyName}
                      onChange={(e) => updateFormData('companyName', e.target.value)}
                    />
                  </div>

                  {/* 업종 */}
                  <div className="space-y-2">
                    <Label>업종 *</Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) => updateFormData('industry', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="업종을 선택해주세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 직원수 & 소재지 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeCount">
                        직원수 *
                        {lookupResult?.found && lookupResult.employeeRange && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (추정)
                          </span>
                        )}
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="employeeCount"
                          type="number"
                          placeholder="10"
                          className="pl-10"
                          value={formData.employeeCount}
                          onChange={(e) => updateFormData('employeeCount', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>소재지 *</Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value) => updateFormData('location', value)}
                      >
                        <SelectTrigger>
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="지역 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATIONS.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 매출 & 설립일 (선택) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="annualRevenue">연매출 (선택)</Label>
                      <div className="relative">
                        <Input
                          id="annualRevenue"
                          type="number"
                          placeholder="10"
                          className="pr-10"
                          value={formData.annualRevenue}
                          onChange={(e) => updateFormData('annualRevenue', e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          억원
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="foundedDate">설립일 (선택)</Label>
                      <Input
                        id="foundedDate"
                        type="date"
                        value={formData.foundedDate}
                        onChange={(e) => updateFormData('foundedDate', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 인증서 */}
                  <div className="space-y-2">
                    <Label>보유 인증 (선택)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {CERTIFICATIONS.map((cert) => (
                        <div key={cert} className="flex items-center space-x-2">
                          <Checkbox
                            id={cert}
                            checked={formData.certifications.includes(cert)}
                            onCheckedChange={() => toggleCertification(cert)}
                          />
                          <label
                            htmlFor={cert}
                            className="text-sm cursor-pointer"
                          >
                            {cert}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      이전
                    </Button>
                    <Button
                      onClick={handleStep2Next}
                      className="flex-1"
                    >
                      다음
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 3단계: 이메일 입력 */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">이메일을 입력해주세요</CardTitle>
                  <CardDescription>
                    분석 결과를 이메일로도 보내드려요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@company.com"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  {/* 입력 정보 요약 */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">입력하신 정보</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>회사명: {formData.companyName}</p>
                      <p>업종: {formData.industry}</p>
                      <p>직원수: {formData.employeeCount}명</p>
                      <p>소재지: {formData.location}</p>
                      {formData.annualRevenue && <p>연매출: {formData.annualRevenue}억원</p>}
                      {formData.certifications.length > 0 && (
                        <p>인증: {formData.certifications.join(', ')}</p>
                      )}
                    </div>
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      이전
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="flex-1"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI 분석 시작
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 4단계: 분석 중 */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardContent className="py-16">
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-2">AI가 분석 중이에요</h2>
                      <p className="text-muted-foreground">
                        {formData.companyName}님에게 딱 맞는 지원사업을 찾고 있어요
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>기업 정보 확인 완료</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>공고 매칭 분석 중...</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-50">
                        <Search className="h-4 w-4" />
                        <span>최적 지원사업 선정</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 하단 안내 */}
        {step < 4 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-primary hover:underline">
                로그인
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

/**
 * Step 1: 사업자번호 입력
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Users,
  MapPin,
  ArrowRight,
  Loader2,
  CheckCircle,
  Shield,
  AlertCircle,
  Briefcase,
  Calendar,
  Database,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { FormData, UnifiedLookupResult } from '../types'

interface Step1Props {
  formData: FormData
  lookupResult: UnifiedLookupResult | null
  lookupError: string | null
  lookingUp: boolean
  updateFormData: (key: keyof FormData, value: string | string[]) => void
  onNext: () => void
  onSkip: () => void
}

export default function Step1({
  formData,
  lookupResult,
  lookupError,
  lookingUp,
  updateFormData,
  onNext,
  onSkip,
}: Step1Props) {
  return (
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

        {/* 조회 결과 표시 - 기업정보를 찾은 경우 */}
        {lookupResult?.success && lookupResult.data && (
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
              {/* 회사명 */}
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-green-600" />
                <span className="font-medium">{lookupResult.data.companyName}</span>
                {lookupResult.data.corporationType && lookupResult.data.corporationType !== '알 수 없음' && (
                  <Badge variant="outline" className="text-xs">
                    {lookupResult.data.corporationType}
                  </Badge>
                )}
              </div>
              {/* 대표자 */}
              {lookupResult.data.ceoName && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">대표: {lookupResult.data.ceoName}</span>
                </div>
              )}
              {/* 업종 */}
              {lookupResult.data.businessType && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">
                    {lookupResult.data.businessType}
                    {lookupResult.data.industryName && lookupResult.data.industryName !== '기타' && (
                      <span className="text-xs ml-1">({lookupResult.data.industryName})</span>
                    )}
                  </span>
                </div>
              )}
              {/* 주소 */}
              {lookupResult.data.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-muted-foreground">{lookupResult.data.address}</span>
                </div>
              )}
              {/* 직원수 */}
              {lookupResult.data.employeeCount && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">
                    직원 약 {lookupResult.data.employeeCount}명
                    {lookupResult.data.companySize && lookupResult.data.companySize !== '알 수 없음' && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {lookupResult.data.companySize}
                      </Badge>
                    )}
                  </span>
                </div>
              )}
              {/* 설립일 */}
              {lookupResult.data.establishedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">
                    설립: {lookupResult.data.establishedDate.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1년 $2월 $3일')}
                  </span>
                </div>
              )}
              {/* 사업자 상태 */}
              {lookupResult.data.ntsStatus && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">
                    {lookupResult.data.ntsStatus}
                    {lookupResult.data.taxType && ` · ${lookupResult.data.taxType}`}
                  </span>
                </div>
              )}
            </div>
            {/* 데이터 소스 */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Database className="h-3 w-3" />
              <span>
                데이터 소스: {lookupResult.data.sources?.join(', ').toUpperCase() || 'NTS, NPS, DART'}
              </span>
            </div>
          </motion.div>
        )}

        {/* 조회 실패 */}
        {lookupResult && !lookupResult.success && (
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
          onClick={onNext}
          disabled={lookingUp}
          className="w-full"
          size="lg"
        >
          {lookupResult?.success ? (
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
          onClick={onSkip}
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
  )
}

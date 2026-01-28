/**
 * Step 2: 기업정보 입력
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Users,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react'
import type { FormData, UnifiedLookupResult } from '../types'
import { INDUSTRIES, LOCATIONS, CERTIFICATIONS } from '../constants'

interface Step2Props {
  formData: FormData
  lookupResult: UnifiedLookupResult | null
  updateFormData: (key: keyof FormData, value: string | string[]) => void
  toggleCertification: (cert: string) => void
  onNext: () => void
  onPrevious: () => void
}

export default function Step2({
  formData,
  lookupResult,
  updateFormData,
  toggleCertification,
  onNext,
  onPrevious,
}: Step2Props) {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">기업 정보를 확인해주세요</CardTitle>
        <CardDescription>
          {lookupResult?.success
            ? '자동으로 채워진 정보를 확인하고 수정해주세요'
            : '더 정확한 매칭을 위해 기업 정보가 필요해요'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 자동 입력 안내 */}
        {lookupResult?.success && (
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
              {lookupResult.data?.sources?.length || 0}개 소스
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
          <Label>
            업종 *
            {lookupResult?.success && lookupResult.data?.businessType && (
              <span className="text-xs text-green-600 ml-1">(자동 입력됨)</span>
            )}
          </Label>
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
              {lookupResult?.success && lookupResult.data?.employeeCount && (
                <span className="text-xs text-green-600 ml-1">(자동)</span>
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
            <Label>
              소재지 *
              {lookupResult?.success && lookupResult.data?.location && (
                <span className="text-xs text-green-600 ml-1">(자동)</span>
              )}
            </Label>
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
            <Label htmlFor="foundedDate">
              설립일 (선택)
              {lookupResult?.success && lookupResult.data?.establishedDate && (
                <span className="text-xs text-green-600 ml-1">(자동)</span>
              )}
            </Label>
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
            onClick={onPrevious}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            이전
          </Button>
          <Button
            onClick={onNext}
            className="flex-1"
          >
            다음
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

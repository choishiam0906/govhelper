'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Search } from 'lucide-react'
import { FieldErrors } from 'react-hook-form'

// 타입 임포트
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

interface CompanyFormBasicProps {
  register: any
  errors: FieldErrors<any>
  watch: any
  verifying: boolean
  lookupResult: UnifiedBusinessInfo | null
  lookupError: string | null
  onVerify: () => void
}

export function CompanyFormBasic({
  register,
  errors,
  watch,
  verifying,
  lookupResult,
  lookupError,
  onVerify,
}: CompanyFormBasicProps) {

  return (
    <div className="space-y-4">
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
          <p className="text-sm text-red-500">{errors.name.message as string}</p>
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
            onClick={onVerify}
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

        {/* 조회 결과 */}
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

        {/* 조회 오류 */}
        {lookupError && (
          <div className="flex items-center gap-2 mt-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-500">
              {lookupError}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

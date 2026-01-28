/**
 * Step 3: 이메일 입력
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Mail,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import type { FormData } from '../types'

interface Step3Props {
  formData: FormData
  updateFormData: (key: keyof FormData, value: string | string[]) => void
  onSubmit: () => void
  onPrevious: () => void
}

export default function Step3({
  formData,
  updateFormData,
  onSubmit,
  onPrevious,
}: Step3Props) {
  return (
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
            {formData.foundedDate && <p>설립일: {formData.foundedDate}</p>}
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
            onClick={onPrevious}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            이전
          </Button>
          <Button
            onClick={onSubmit}
            className="flex-1"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI 분석 시작
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

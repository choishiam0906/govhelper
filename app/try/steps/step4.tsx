/**
 * Step 4: 분석 중
 */

import { Card, CardContent } from '@/components/ui/card'
import {
  Loader2,
  CheckCircle,
  Search,
} from 'lucide-react'
import type { FormData } from '../types'

interface Step4Props {
  formData: FormData
}

export default function Step4({ formData }: Step4Props) {
  return (
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
  )
}

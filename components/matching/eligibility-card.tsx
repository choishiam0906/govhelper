'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, XCircle, AlertCircle, Info, ArrowRight, AlertTriangle } from 'lucide-react'
import { EligibilityCheck } from '@/types'

interface EligibilityCardProps {
  eligibility: EligibilityCheck
}

interface CheckItemProps {
  label: string
  check: {
    passed: boolean
    requirement: string
    companyValue: string
    reason: string
  }
}

function CheckItem({ label, check }: CheckItemProps) {
  const isNoRestriction = check.requirement === '제한 없음' || check.requirement.includes('제한 없음')

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${check.passed ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
      <div className="flex-shrink-0 mt-0.5">
        {check.passed ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{label}</span>
          {check.passed ? (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              충족
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
              미충족
            </Badge>
          )}
        </div>
        <div className="text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-medium min-w-[52px]">요구조건</span>
            <ArrowRight className="h-3 w-3" />
            <span>{check.requirement}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-medium min-w-[52px]">기업현황</span>
            <ArrowRight className="h-3 w-3" />
            <span>{check.companyValue}</span>
          </div>
          {!isNoRestriction && check.reason && (
            <p className={`mt-1 ${check.passed ? 'text-green-700' : 'text-red-700'}`}>
              {check.reason}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function EligibilityCard({ eligibility }: EligibilityCardProps) {
  const passedCount = Object.values(eligibility.checks).filter(c => c.passed).length
  const totalCount = Object.keys(eligibility.checks).length

  return (
    <Card className={eligibility.isEligible ? 'border-green-200' : 'border-red-200'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {eligibility.isEligible ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-500" />
            )}
            <CardTitle>1단계: 자격 조건 검토</CardTitle>
          </div>
          <Badge
            variant={eligibility.isEligible ? 'default' : 'destructive'}
            className="text-sm px-3 py-1"
          >
            {eligibility.isEligible ? '지원 가능' : '지원 불가'}
          </Badge>
        </div>
        <CardDescription>
          {eligibility.isEligible
            ? `모든 자격 조건을 충족해요 (${passedCount}/${totalCount})`
            : `일부 자격 조건이 미충족이에요 (${passedCount}/${totalCount})`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <CheckItem label="업종 조건" check={eligibility.checks.industry} />
        <CheckItem label="지역 조건" check={eligibility.checks.region} />
        <CheckItem label="업력 조건" check={eligibility.checks.companyAge} />
        <CheckItem label="매출 조건" check={eligibility.checks.revenue} />
        <CheckItem label="직원수 조건" check={eligibility.checks.employeeCount} />

        {/* 요약 진행 바 */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">자격 충족도</span>
            <span className="text-sm font-bold">
              {passedCount}/{totalCount} 조건 충족
            </span>
          </div>
          <Progress
            value={(passedCount / totalCount) * 100}
            className="h-2"
          />
        </div>

        {!eligibility.isEligible && eligibility.failedReasons.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-800">지원 불가 사유</span>
            </div>
            <ul className="space-y-2">
              {eligibility.failedReasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-red-200">
              <p className="text-xs text-red-600">
                위 조건을 충족하지 못하면 지원이 불가해요. 기업 정보를 업데이트하거나 다른 공고를 찾아보세요.
              </p>
            </div>
          </div>
        )}

        {eligibility.isEligible && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">모든 자격 조건을 충족해요</span>
            </div>
            <p className="text-sm text-green-700 mt-2">
              이 공고에 지원할 수 있어요. 아래 적합도 점수를 확인해 보세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

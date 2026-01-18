'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react'
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
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
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
        <div className="text-xs text-muted-foreground space-y-1">
          <p><span className="font-medium">요구조건:</span> {check.requirement}</p>
          <p><span className="font-medium">기업현황:</span> {check.companyValue}</p>
          {!isNoRestriction && (
            <p className="text-foreground/70">{check.reason}</p>
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

        {!eligibility.isEligible && eligibility.failedReasons.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800 text-sm">지원 불가 사유</span>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {eligibility.failedReasons.map((reason, i) => (
                <li key={i}>• {reason}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

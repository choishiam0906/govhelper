'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  Briefcase,
  Users,
  Coins,
  Calendar,
  MapPin,
  Award,
  Info,
  XCircle,
} from 'lucide-react'
import type { Announcement, EligibilityCriteria } from './types'

interface EligibilityTabProps {
  announcement: Announcement
  onEligibilityUpdated: (criteria: EligibilityCriteria) => void
}

/**
 * 지원 자격 탭 컴포넌트
 * - AI 지원자격 파싱 기능
 * - 구조화된 지원자격 표시 (기업유형, 규모, 지역, 인증 등)
 */
export function EligibilityTab({ announcement, onEligibilityUpdated }: EligibilityTabProps) {
  const [parsingEligibility, setParsingEligibility] = useState(false)

  const parseEligibility = async () => {
    setParsingEligibility(true)
    try {
      const response = await fetch(`/api/announcements/parse-eligibility?id=${announcement.id}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      onEligibilityUpdated(result.data)

      if (result.cached) {
        toast.info('저장된 지원자격 정보를 불러왔어요')
      } else {
        toast.success('지원자격을 분석했어요')
      }
    } catch (error) {
      toast.error('지원자격 분석에 실패했어요')
    } finally {
      setParsingEligibility(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              지원 자격
            </CardTitle>
            <CardDescription>이 공고에 지원하기 위한 자격 요건이에요</CardDescription>
          </div>
          {!announcement.eligibility_criteria && (
            <Button
              variant="outline"
              size="sm"
              onClick={parseEligibility}
              disabled={parsingEligibility}
            >
              {parsingEligibility ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI 분석
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {announcement.eligibility_criteria ? (
          <div className="space-y-6">
            {/* 요약 카드 */}
            {announcement.eligibility_criteria.summary && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 mb-1">AI 분석 요약</p>
                    <p className="text-blue-800">{announcement.eligibility_criteria.summary}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-blue-600">분석 신뢰도</span>
                      <Progress
                        value={announcement.eligibility_criteria.confidence * 100}
                        className="h-2 w-24"
                      />
                      <span className="text-xs font-medium text-blue-700">
                        {Math.round(announcement.eligibility_criteria.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 기업 유형 */}
            {announcement.eligibility_criteria.companyTypes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">지원 가능 기업 유형</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {announcement.eligibility_criteria.companyTypes.map((type, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 규모 조건 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {announcement.eligibility_criteria.employeeCount && (
                <div className="p-4 border rounded-xl bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">직원수</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-800">
                    {announcement.eligibility_criteria.employeeCount.description}
                  </p>
                </div>
              )}
              {announcement.eligibility_criteria.revenue && (
                <div className="p-4 border rounded-xl bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="h-5 w-5 text-green-600" />
                    <span className="font-medium">매출</span>
                  </div>
                  <p className="text-lg font-semibold text-green-800">
                    {announcement.eligibility_criteria.revenue.description}
                  </p>
                </div>
              )}
              {announcement.eligibility_criteria.businessAge && (
                <div className="p-4 border rounded-xl bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">업력</span>
                  </div>
                  <p className="text-lg font-semibold text-purple-800">
                    {announcement.eligibility_criteria.businessAge.description}
                  </p>
                </div>
              )}
            </div>

            {/* 지역 */}
            {announcement.eligibility_criteria.regions.description && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">지역 조건</h4>
                </div>
                <p className="text-muted-foreground pl-7">
                  {announcement.eligibility_criteria.regions.description}
                </p>
              </div>
            )}

            {/* 필요 인증 */}
            {announcement.eligibility_criteria.requiredCertifications.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">필요 인증/자격</h4>
                </div>
                <div className="flex flex-wrap gap-2 pl-7">
                  {announcement.eligibility_criteria.requiredCertifications.map((cert, idx) => (
                    <Badge key={idx} variant="outline" className="bg-amber-50 border-amber-200 text-amber-800">
                      <Award className="h-3 w-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 기타 요건 */}
            {announcement.eligibility_criteria.additionalRequirements.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">기타 요건</h4>
                </div>
                <ul className="space-y-2 pl-7">
                  {announcement.eligibility_criteria.additionalRequirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 지원 제외 대상 */}
            {announcement.eligibility_criteria.exclusions.length > 0 && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <h4 className="font-semibold text-red-800">지원 제외 대상</h4>
                </div>
                <ul className="space-y-2">
                  {announcement.eligibility_criteria.exclusions.map((ex, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-red-700">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : announcement.target_company ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <p className="font-medium mb-2">지원 대상 (기본 정보)</p>
              <p className="text-muted-foreground">{announcement.target_company}</p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              'AI 분석' 버튼을 클릭하면 더 자세한 지원자격 정보를 확인할 수 있어요
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">지원자격 정보가 없어요</p>
            <p className="text-sm text-muted-foreground mb-4">
              AI가 공고 내용에서 지원자격을 분석해드려요
            </p>
            <Button variant="outline" onClick={parseEligibility} disabled={parsingEligibility}>
              {parsingEligibility ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI로 분석하기
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

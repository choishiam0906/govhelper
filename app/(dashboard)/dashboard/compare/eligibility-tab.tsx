'use client'

import {
  Shield,
  Briefcase,
  Users,
  Coins,
  Calendar,
  MapPin,
  Building2,
  Award,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CompareAnnouncement } from '@/stores/compare-store'
import { formatMoney } from './utils'

interface EligibilityTabProps {
  announcements: CompareAnnouncement[]
  loading: boolean
  eligCount: number
}

export function EligibilityTab({ announcements, loading, eligCount }: EligibilityTabProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            자격조건 비교
          </CardTitle>
          <CardDescription>공고별 지원자격 조건을 비교해 보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (eligCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            자격조건 비교
          </CardTitle>
          <CardDescription>공고별 지원자격 조건을 비교해 보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">비교 중인 공고에 자격조건 정보가 없어요</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5" />
          자격조건 비교
        </CardTitle>
        <CardDescription>공고별 지원자격 조건을 비교해 보세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[140px]">조건</th>
                {announcements.map((a) => (
                  <th key={a.id} className="text-left py-3 px-4 font-medium">
                    <span className="line-clamp-1">{a.title}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 기업 유형 */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-4 font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    기업 유형
                  </span>
                </td>
                {announcements.map((a) => (
                  <td key={a.id} className="py-3 px-4">
                    {a.eligibility_criteria?.companyTypes?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {a.eligibility_criteria.companyTypes.map((type, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* 직원수 */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-4 font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    직원수
                  </span>
                </td>
                {announcements.map((a) => (
                  <td key={a.id} className="py-3 px-4">
                    {a.eligibility_criteria?.employeeCount ? (
                      <div>
                        <span className="font-medium">
                          {a.eligibility_criteria.employeeCount.min || 0}명
                          {a.eligibility_criteria.employeeCount.max &&
                            ` ~ ${a.eligibility_criteria.employeeCount.max}명`}
                        </span>
                        {a.eligibility_criteria.employeeCount.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {a.eligibility_criteria.employeeCount.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">제한 없음</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* 매출액 */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-4 font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    매출액
                  </span>
                </td>
                {announcements.map((a) => (
                  <td key={a.id} className="py-3 px-4">
                    {a.eligibility_criteria?.revenue ? (
                      <div>
                        <span className="font-medium">
                          {a.eligibility_criteria.revenue.min
                            ? `${formatMoney(a.eligibility_criteria.revenue.min)} 이상`
                            : ''}
                          {a.eligibility_criteria.revenue.min && a.eligibility_criteria.revenue.max && ' ~ '}
                          {a.eligibility_criteria.revenue.max
                            ? `${formatMoney(a.eligibility_criteria.revenue.max)} 이하`
                            : ''}
                        </span>
                        {a.eligibility_criteria.revenue.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {a.eligibility_criteria.revenue.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">제한 없음</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* 업력 */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-4 font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    업력
                  </span>
                </td>
                {announcements.map((a) => (
                  <td key={a.id} className="py-3 px-4">
                    {a.eligibility_criteria?.businessAge ? (
                      <div>
                        <span className="font-medium">
                          {a.eligibility_criteria.businessAge.min
                            ? `${a.eligibility_criteria.businessAge.min}년 이상`
                            : ''}
                          {a.eligibility_criteria.businessAge.min && a.eligibility_criteria.businessAge.max && ' ~ '}
                          {a.eligibility_criteria.businessAge.max
                            ? `${a.eligibility_criteria.businessAge.max}년 이하`
                            : ''}
                        </span>
                        {a.eligibility_criteria.businessAge.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {a.eligibility_criteria.businessAge.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">제한 없음</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* 지역 */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-4 font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    지역
                  </span>
                </td>
                {announcements.map((a) => (
                  <td key={a.id} className="py-3 px-4">
                    {a.eligibility_criteria?.regions?.included?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {a.eligibility_criteria.regions.included.slice(0, 5).map((region, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700">
                            {region}
                          </Badge>
                        ))}
                        {a.eligibility_criteria.regions.included.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{a.eligibility_criteria.regions.included.length - 5}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-green-600">전국</span>
                    )}
                    {a.eligibility_criteria?.regions?.excluded?.length ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {a.eligibility_criteria.regions.excluded.map((region, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            {region}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </td>
                ))}
              </tr>

              {/* 업종 */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-4 font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    업종
                  </span>
                </td>
                {announcements.map((a) => (
                  <td key={a.id} className="py-3 px-4">
                    {a.eligibility_criteria?.industries?.included?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {a.eligibility_criteria.industries.included.slice(0, 3).map((ind, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            {ind}
                          </Badge>
                        ))}
                        {a.eligibility_criteria.industries.included.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{a.eligibility_criteria.industries.included.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-blue-600">전 업종</span>
                    )}
                    {a.eligibility_criteria?.industries?.excluded?.length ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {a.eligibility_criteria.industries.excluded.slice(0, 3).map((ind, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            {ind}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </td>
                ))}
              </tr>

              {/* 필수 인증 */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-4 font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    필수 인증
                  </span>
                </td>
                {announcements.map((a) => (
                  <td key={a.id} className="py-3 px-4">
                    {a.eligibility_criteria?.requiredCertifications?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {a.eligibility_criteria.requiredCertifications.map((cert, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">없음</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* 제외 조건 */}
              <tr className="hover:bg-muted/50">
                <td className="py-3 px-4 font-medium text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    제외 조건
                  </span>
                </td>
                {announcements.map((a) => (
                  <td key={a.id} className="py-3 px-4">
                    {a.eligibility_criteria?.exclusions?.length ? (
                      <div className="space-y-1">
                        {a.eligibility_criteria.exclusions.slice(0, 3).map((exc, i) => (
                          <div key={i} className="text-xs text-red-600 flex items-start gap-1">
                            <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {exc}
                          </div>
                        ))}
                        {a.eligibility_criteria.exclusions.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{a.eligibility_criteria.exclusions.length - 3}개 더
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

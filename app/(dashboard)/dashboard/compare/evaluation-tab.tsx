'use client'

import { BarChart3, Target, CheckCircle, FileText, Award, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { CompareAnnouncement } from '@/stores/compare-store'

interface EvaluationTabProps {
  announcements: CompareAnnouncement[]
  loading: boolean
  evalCount: number
}

export function EvaluationTab({ announcements, loading, evalCount }: EvaluationTabProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            평가기준 비교
          </CardTitle>
          <CardDescription>공고별 평가항목과 배점을 비교해 보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (evalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            평가기준 비교
          </CardTitle>
          <CardDescription>공고별 평가항목과 배점을 비교해 보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">비교 중인 공고에 평가기준 정보가 없어요</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 모든 카테고리 추출
  const allCategories = new Set<string>()
  announcements.forEach((a) => {
    a.evaluation_criteria?.items?.forEach((item) => {
      allCategories.add(item.category)
    })
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          평가기준 비교
        </CardTitle>
        <CardDescription>공고별 평가항목과 배점을 비교해 보세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 평가기준 요약 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[140px]">항목</th>
                  {announcements.map((a) => (
                    <th key={a.id} className="text-left py-3 px-4 font-medium">
                      <span className="line-clamp-1">{a.title}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      총점
                    </span>
                  </td>
                  {announcements.map((a) => (
                    <td key={a.id} className="py-3 px-4">
                      {a.evaluation_criteria ? (
                        <span className="font-bold text-primary">{a.evaluation_criteria.totalScore}점</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      합격 기준
                    </span>
                  </td>
                  {announcements.map((a) => (
                    <td key={a.id} className="py-3 px-4">
                      {a.evaluation_criteria?.passingScore ? (
                        <span className="font-medium text-green-600">
                          {a.evaluation_criteria.passingScore}점 이상
                        </span>
                      ) : (
                        <span className="text-muted-foreground">미정</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      심사 단계
                    </span>
                  </td>
                  {announcements.map((a) => (
                    <td key={a.id} className="py-3 px-4">
                      {a.evaluation_criteria?.evaluationMethod?.stageNames ? (
                        <div className="flex flex-wrap gap-1">
                          {a.evaluation_criteria.evaluationMethod.stageNames.map((name, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {i + 1}. {name}
                            </Badge>
                          ))}
                        </div>
                      ) : a.evaluation_criteria?.evaluationMethod?.stages ? (
                        <span>{a.evaluation_criteria.evaluationMethod.stages}단계</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      가점 항목
                    </span>
                  </td>
                  {announcements.map((a) => (
                    <td key={a.id} className="py-3 px-4">
                      {a.evaluation_criteria?.bonusItems && a.evaluation_criteria.bonusItems.length > 0 ? (
                        <div className="space-y-1">
                          {a.evaluation_criteria.bonusItems.slice(0, 3).map((bonus, i) => (
                            <div key={i} className="text-xs">
                              <Badge variant="secondary" className="mr-1">
                                +{bonus.score}점
                              </Badge>
                              {bonus.name}
                            </div>
                          ))}
                          {a.evaluation_criteria.bonusItems.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{a.evaluation_criteria.bonusItems.length - 3}개 더
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

          {/* 평가항목 상세 비교 */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              평가항목 배점 비교
            </h4>

            {Array.from(allCategories).map((category) => (
              <div key={category} className="border rounded-lg p-4">
                <h5 className="font-medium mb-3">{category}</h5>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${announcements.length}, 1fr)` }}>
                  {announcements.map((a) => {
                    const categoryItems =
                      a.evaluation_criteria?.items?.filter((item) => item.category === category) || []
                    const totalCategoryScore = categoryItems.reduce((sum, item) => sum + item.maxScore, 0)

                    return (
                      <div key={a.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground line-clamp-1">{a.title}</span>
                          <Badge variant="outline">{totalCategoryScore}점</Badge>
                        </div>
                        <Progress
                          value={
                            a.evaluation_criteria ? (totalCategoryScore / a.evaluation_criteria.totalScore) * 100 : 0
                          }
                          className="h-2"
                        />
                        {categoryItems.length > 0 && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {categoryItems.slice(0, 3).map((item, i) => (
                              <div key={i} className="flex justify-between">
                                <span className="truncate">{item.name}</span>
                                <span>{item.maxScore}점</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

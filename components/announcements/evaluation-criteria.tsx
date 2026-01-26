'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  Sparkles,
  Award,
  Target,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { EvaluationCriteria } from '@/types'

interface EvaluationCriteriaProps {
  announcementId: string
  initialCriteria: EvaluationCriteria | null
  onCriteriaLoaded?: (criteria: EvaluationCriteria) => void
}

// 카테고리별 색상
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  '기술성': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  '사업성': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  '시장성': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  '역량': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  '가점': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  '기타': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
}

function getCategoryColor(category: string) {
  // 카테고리명에 포함된 키워드로 색상 결정
  if (category.includes('기술')) return categoryColors['기술성']
  if (category.includes('사업')) return categoryColors['사업성']
  if (category.includes('시장')) return categoryColors['시장성']
  if (category.includes('역량') || category.includes('수행')) return categoryColors['역량']
  if (category.includes('가점') || category.includes('우대')) return categoryColors['가점']
  return categoryColors['기타']
}

export function EvaluationCriteriaDisplay({
  announcementId,
  initialCriteria,
  onCriteriaLoaded
}: EvaluationCriteriaProps) {
  const [criteria, setCriteria] = useState<EvaluationCriteria | null>(initialCriteria)
  const [loading, setLoading] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const parseEvaluation = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/announcements/parse-evaluation?id=${announcementId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setCriteria(result.data)
      onCriteriaLoaded?.(result.data)

      if (result.cached) {
        toast.info('저장된 평가기준 정보를 불러왔어요')
      } else {
        toast.success('평가기준을 분석했어요')
      }
    } catch (error) {
      toast.error('평가기준 분석에 실패했어요')
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // 카테고리별로 그룹화
  const groupedItems = criteria?.items?.reduce((acc, item) => {
    const category = item.category || '기타'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, typeof criteria.items>) || {}

  if (!criteria) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">평가기준 정보가 없어요</p>
        <p className="text-sm text-muted-foreground mb-4">
          AI가 공고 내용에서 평가기준을 분석해드려요
        </p>
        <Button variant="outline" onClick={parseEvaluation} disabled={loading}>
          {loading ? (
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
    )
  }

  return (
    <div className="space-y-6">
      {/* 총점 및 합격 기준 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Target className="h-4 w-4" />
            <span className="text-xs font-medium">총점</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {criteria.totalScore}점
          </p>
        </div>

        {criteria.passingScore && (
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">합격 기준</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {criteria.passingScore}점 이상
            </p>
          </div>
        )}

        {criteria.evaluationMethod && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">평가 방식</span>
            </div>
            <p className="text-lg font-semibold text-blue-700">
              {criteria.evaluationMethod.type === 'absolute' ? '절대평가' : '상대평가'}
              {criteria.evaluationMethod.stages && (
                <span className="text-sm font-normal ml-1">
                  ({criteria.evaluationMethod.stages}단계)
                </span>
              )}
            </p>
            {criteria.evaluationMethod.stageNames && criteria.evaluationMethod.stageNames.length > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                {criteria.evaluationMethod.stageNames.join(' → ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 신뢰도 표시 */}
      {criteria.confidence && (
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
          <Info className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">AI 분석 신뢰도</span>
              <span className="text-sm font-medium">
                {Math.round(criteria.confidence * 100)}%
              </span>
            </div>
            <Progress value={criteria.confidence * 100} className="h-2" />
          </div>
        </div>
      )}

      {/* 카테고리별 평가항목 */}
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          평가항목 상세
        </h4>

        {Object.entries(groupedItems).map(([category, items]) => {
          const colors = getCategoryColor(category)
          const totalCategoryScore = items.reduce((sum, item) => sum + (item.maxScore || 0), 0)
          const isExpanded = expandedCategories.has(category)

          return (
            <div key={category} className={`border rounded-xl overflow-hidden ${colors.border}`}>
              {/* 카테고리 헤더 */}
              <button
                onClick={() => toggleCategory(category)}
                className={`w-full p-4 ${colors.bg} flex items-center justify-between hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white/60`}>
                    <BarChart3 className={`h-4 w-4 ${colors.text}`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-semibold ${colors.text}`}>{category}</p>
                    <p className="text-sm text-muted-foreground">
                      {items.length}개 항목
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className={`${colors.bg} ${colors.text} border-none`}>
                    {totalCategoryScore}점
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className={`h-5 w-5 ${colors.text}`} />
                  ) : (
                    <ChevronDown className={`h-5 w-5 ${colors.text}`} />
                  )}
                </div>
              </button>

              {/* 세부 항목 */}
              {isExpanded && (
                <div className="p-4 space-y-3 bg-white">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {item.maxScore}점
                        </Badge>
                      </div>

                      {/* 세부 항목 */}
                      {item.subItems && item.subItems.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-slate-200 space-y-2">
                          {item.subItems.map((sub, subIdx) => (
                            <div key={subIdx} className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm">{sub.name}</p>
                                {sub.description && (
                                  <p className="text-xs text-muted-foreground">
                                    {sub.description}
                                  </p>
                                )}
                                {sub.keywords && sub.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {sub.keywords.map((keyword, kIdx) => (
                                      <Badge key={kIdx} variant="secondary" className="text-xs px-1.5 py-0">
                                        {keyword}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground shrink-0">
                                {sub.maxScore}점
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 가점/감점 항목 */}
      {criteria.bonusItems && criteria.bonusItems.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-600" />
            가점/감점 항목
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criteria.bonusItems.map((bonus, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  bonus.type === 'bonus'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {bonus.type === 'bonus' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <p className={`font-medium ${
                        bonus.type === 'bonus' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {bonus.name}
                      </p>
                    </div>
                    <p className={`text-sm ${
                      bonus.type === 'bonus' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {bonus.condition}
                    </p>
                  </div>
                  <Badge className={
                    bonus.type === 'bonus'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }>
                    {bonus.type === 'bonus' ? '+' : '-'}{Math.abs(bonus.score)}점
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메타 정보 */}
      {criteria.extractedAt && (
        <p className="text-xs text-muted-foreground text-right">
          마지막 분석: {new Date(criteria.extractedAt).toLocaleString('ko-KR')}
          {criteria.source && ` (출처: ${criteria.source})`}
        </p>
      )}
    </div>
  )
}

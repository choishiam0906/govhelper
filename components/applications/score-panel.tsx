'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Loader2,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import { ApplicationScoreFeedback } from '@/types'

interface ScorePanelProps {
  totalEstimatedScore: number
  totalMaxScore: number
  percentage: number
  sectionScores: ApplicationScoreFeedback[]
  overallFeedback: string
  isLoading?: boolean
  onRefresh?: () => void
}

// 점수에 따른 색상 및 상태
function getScoreStatus(percentage: number) {
  if (percentage >= 80) {
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      progressColor: 'bg-green-500',
      label: '우수',
      icon: CheckCircle2,
    }
  }
  if (percentage >= 60) {
    return {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      progressColor: 'bg-blue-500',
      label: '양호',
      icon: TrendingUp,
    }
  }
  if (percentage >= 40) {
    return {
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      progressColor: 'bg-amber-500',
      label: '보통',
      icon: BarChart3,
    }
  }
  return {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    progressColor: 'bg-red-500',
    label: '개선 필요',
    icon: AlertCircle,
  }
}

function SectionScoreItem({ score }: { score: ApplicationScoreFeedback }) {
  const [isOpen, setIsOpen] = useState(false)
  const percentage = Math.round((score.estimatedScore / score.maxScore) * 100)
  const status = getScoreStatus(percentage)
  const StatusIcon = status.icon

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`p-3 rounded-lg border ${status.borderColor} ${status.bgColor}`}>
        <CollapsibleTrigger asChild>
          <button className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-4 w-4 ${status.color}`} />
                <span className="font-medium text-sm">{score.section}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${status.color}`}>
                  {score.estimatedScore}/{score.maxScore}점
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            <Progress
              value={percentage}
              className="h-1.5 mt-2"
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-3 space-y-3">
          {/* 관련 평가항목 */}
          {score.relatedEvalItems.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {score.relatedEvalItems.map((item, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          )}

          {/* 피드백 */}
          <p className="text-sm text-muted-foreground">{score.feedback}</p>

          {/* 개선 제안 */}
          {score.suggestions.length > 0 && (
            <div className="pt-2 border-t border-dashed">
              <div className="flex items-center gap-1 mb-2">
                <Lightbulb className="h-3 w-3 text-amber-500" />
                <span className="text-xs font-medium text-amber-700">개선 제안</span>
              </div>
              <ul className="space-y-1">
                {score.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export function ScorePanel({
  totalEstimatedScore,
  totalMaxScore,
  percentage,
  sectionScores,
  overallFeedback,
  isLoading = false,
  onRefresh,
}: ScorePanelProps) {
  const status = getScoreStatus(percentage)
  const StatusIcon = status.icon

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            예상 평가점수
          </CardTitle>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-sm">점수 분석 중...</p>
          </div>
        ) : percentage === 0 && sectionScores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">지원서를 작성하면</p>
            <p className="text-sm">예상 점수가 표시돼요</p>
          </div>
        ) : (
          <>
            {/* 총점 표시 */}
            <div className={`p-4 rounded-xl ${status.bgColor} border ${status.borderColor}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-5 w-5 ${status.color}`} />
                  <span className={`font-medium ${status.color}`}>{status.label}</span>
                </div>
                <Badge variant="outline" className={status.color}>
                  {percentage}%
                </Badge>
              </div>
              <div className="text-center">
                <span className={`text-4xl font-bold ${status.color}`}>
                  {totalEstimatedScore}
                </span>
                <span className="text-lg text-muted-foreground">
                  /{totalMaxScore}점
                </span>
              </div>
              <Progress
                value={percentage}
                className="h-2 mt-3"
              />
            </div>

            {/* 전체 피드백 */}
            {overallFeedback && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{overallFeedback}</p>
              </div>
            )}

            {/* 섹션별 점수 */}
            {sectionScores.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  섹션별 분석
                </h4>
                <div className="space-y-2">
                  {sectionScores.map((score, idx) => (
                    <SectionScoreItem key={idx} score={score} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

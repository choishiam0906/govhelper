'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { CompetitionPrediction, CompetitionFactor } from '@/types/competition'
import { COMPETITION_LEVELS } from '@/types/competition'

interface CompetitionPredictionProps {
  announcementId: string
  className?: string
}

export function CompetitionPredictionCard({ announcementId, className }: CompetitionPredictionProps) {
  const [prediction, setPrediction] = useState<CompetitionPrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFactors, setShowFactors] = useState(false)

  const fetchPrediction = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/competition/predict?announcementId=${announcementId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setPrediction(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '예측에 실패했어요')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrediction()
  }, [announcementId])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-6 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchPrediction}>
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!prediction) return null

  const levelInfo = COMPETITION_LEVELS[prediction.level]

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            예상 경쟁률
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>유사 공고 분석과 휴리스틱 모델을 기반으로 예측한 결과예요. 실제 경쟁률과 다를 수 있어요.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          유사 공고 {prediction.similarAnalysis.count}개 분석 기반
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 메인 예측 결과 */}
        <div className={`p-4 rounded-lg ${levelInfo.bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${levelInfo.color}`}>
                {prediction.estimatedRatio}:1
              </span>
              <Badge className={`${levelInfo.bgColor} ${levelInfo.color} border-0`}>
                {levelInfo.label}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              신뢰도 {prediction.confidence}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {levelInfo.description}
          </p>
        </div>

        {/* 경쟁 강도 바 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">경쟁 강도</span>
            <span className="font-medium">{prediction.score}점</span>
          </div>
          <Progress
            value={prediction.score}
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>낮음</span>
            <span>높음</span>
          </div>
        </div>

        {/* 영향 요인 */}
        <Collapsible open={showFactors} onOpenChange={setShowFactors}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between px-2 h-9">
              <span className="text-sm font-medium">영향 요인 {prediction.factors.length}개</span>
              {showFactors ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {prediction.factors.map((factor, index) => (
              <FactorItem key={index} factor={factor} />
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* 조언 */}
        {prediction.tips.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              지원 팁
            </div>
            <ul className="space-y-1.5">
              {prediction.tips.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 영향 요인 아이템
function FactorItem({ factor }: { factor: CompetitionFactor }) {
  const getImpactIcon = () => {
    switch (factor.impact) {
      case 'negative':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'positive':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getImpactText = () => {
    switch (factor.impact) {
      case 'negative':
        return '경쟁률 상승'
      case 'positive':
        return '경쟁률 하락'
      default:
        return '영향 없음'
    }
  }

  return (
    <div className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
      {getImpactIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{factor.name}</span>
          <Badge variant="outline" className="text-xs">
            {getImpactText()}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {factor.description}
        </p>
      </div>
    </div>
  )
}

// 간단 버전 (공고 카드에 표시)
export function CompetitionBadge({ announcementId }: { announcementId: string }) {
  const [prediction, setPrediction] = useState<CompetitionPrediction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const response = await fetch(`/api/competition/predict?announcementId=${announcementId}`)
        const result = await response.json()
        if (result.success) {
          setPrediction(result.data)
        }
      } catch (err) {
        console.error('Competition prediction error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [announcementId])

  if (loading || !prediction) return null

  const levelInfo = COMPETITION_LEVELS[prediction.level]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${levelInfo.bgColor} ${levelInfo.color} border-0 cursor-help`}
          >
            <Users className="h-3 w-3 mr-1" />
            {prediction.estimatedRatio}:1
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>예상 경쟁률: {levelInfo.label}</p>
          <p className="text-xs text-muted-foreground">{levelInfo.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

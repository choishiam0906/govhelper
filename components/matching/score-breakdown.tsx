'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Cpu,
  TrendingUp,
  Briefcase,
  Target,
  Award,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ScoreCategory {
  name: string
  score: number
  maxScore: number
  icon: React.ElementType
  color: string
  bgColor: string
  description: string
  details: string[]
}

interface ScoreBreakdownProps {
  technicalScore: number
  marketScore: number
  businessScore: number
  fitScore: number
  bonusPoints: number
  // 세부 이유 (AI에서 생성)
  scoreDetails?: {
    technical?: string[]
    market?: string[]
    business?: string[]
    fit?: string[]
    bonus?: string[]
  }
}

function ScoreItem({ category, expanded, onToggle }: {
  category: ScoreCategory
  expanded: boolean
  onToggle: () => void
}) {
  const percentage = Math.round((category.score / category.maxScore) * 100)
  const Icon = category.icon

  const getScoreLevel = (pct: number) => {
    if (pct >= 80) return { label: '우수', color: 'text-green-600 bg-green-50 border-green-200' }
    if (pct >= 60) return { label: '양호', color: 'text-blue-600 bg-blue-50 border-blue-200' }
    if (pct >= 40) return { label: '보통', color: 'text-amber-600 bg-amber-50 border-amber-200' }
    return { label: '개선필요', color: 'text-red-600 bg-red-50 border-red-200' }
  }

  const level = getScoreLevel(percentage)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
          category.bgColor
        )}>
          <Icon className={cn("h-5 w-5", category.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium">{category.name}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", level.color)}>
                {level.label}
              </Badge>
              <span className="font-bold text-lg">
                {category.score}<span className="text-sm text-muted-foreground">/{category.maxScore}</span>
              </span>
            </div>
          </div>
          <Progress
            value={percentage}
            className="h-2"
          />
        </div>

        {category.details.length > 0 && (
          <div className="flex-shrink-0">
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        )}
      </button>

      {expanded && category.details.length > 0 && (
        <div className="px-4 pb-4 pt-0 border-t bg-muted/30">
          <p className="text-sm text-muted-foreground mt-3 mb-2">{category.description}</p>
          <ul className="space-y-1.5">
            {category.details.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function ScoreBreakdown({
  technicalScore,
  marketScore,
  businessScore,
  fitScore,
  bonusPoints,
  scoreDetails,
}: ScoreBreakdownProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const categories: ScoreCategory[] = [
    {
      name: '기술성',
      score: technicalScore,
      maxScore: 25,
      icon: Cpu,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: '기술 역량, R&D 능력, 특허/인증 보유 현황을 평가해요',
      details: scoreDetails?.technical || [
        '기업의 기술 경쟁력을 종합적으로 평가',
        '관련 기술 인력 보유 여부 검토',
        '특허, 인증, 기술개발 실적 반영',
      ],
    },
    {
      name: '시장성',
      score: marketScore,
      maxScore: 20,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: '시장 규모, 성장 가능성, 경쟁 우위를 평가해요',
      details: scoreDetails?.market || [
        '타겟 시장의 성장성 분석',
        '기업의 시장 진입 전략 검토',
        '경쟁사 대비 차별화 포인트 평가',
      ],
    },
    {
      name: '사업성',
      score: businessScore,
      maxScore: 20,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: '사업 안정성, 재무 건전성, 실행 역량을 평가해요',
      details: scoreDetails?.business || [
        '재무 상태 및 매출 성장률 분석',
        '사업 수행 인력 및 조직 역량',
        '과거 유사 사업 수행 경험',
      ],
    },
    {
      name: '공고 부합도',
      score: fitScore,
      maxScore: 25,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: '공고 목적과 기업 사업 방향의 일치도를 평가해요',
      details: scoreDetails?.fit || [
        '공고의 지원 목적과 기업 목표 일치도',
        '사업 분야의 관련성',
        '지원 내용 활용 계획의 구체성',
      ],
    },
    {
      name: '가점',
      score: bonusPoints,
      maxScore: 10,
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      description: '정책 우대 조건, 특별 인증 보유 현황을 반영해요',
      details: scoreDetails?.bonus || [
        '벤처기업, 이노비즈 등 인증 보유',
        '여성/청년 기업 등 정책 우대',
        '지역 전략산업 해당 여부',
      ],
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          점수 상세 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((category, index) => (
          <ScoreItem
            key={category.name}
            category={category}
            expanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
          />
        ))}
      </CardContent>
    </Card>
  )
}

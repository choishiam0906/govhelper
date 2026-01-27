'use client'

import { useState } from 'react'
import { Loader2, TrendingUp, Users, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface CompetitionData {
  competitionLevel: 'low' | 'medium' | 'high' | 'very_high'
  competitionScore: number
  estimatedApplicants: string
  factors: Record<string, string>
  recommendation: string
}

export function CompetitionAnalysis({ announcementId }: { announcementId: string }) {
  const [data, setData] = useState<CompetitionData | null>(null)
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/matching/competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId }),
      })
      const result = await res.json()
      if (result.success) setData(result)
    } catch {
      // 에러 무시
    }
    setLoading(false)
  }

  const levelConfig = {
    low: { label: '낮음', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle2 },
    medium: { label: '보통', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: TrendingUp },
    high: { label: '높음', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: Users },
    very_high: { label: '매우 높음', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle },
  }

  if (!data) {
    return (
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">경쟁 분석</h3>
        <p className="text-sm text-muted-foreground mb-3">이 공고의 예상 경쟁도를 분석해요</p>
        <button
          onClick={analyze}
          disabled={loading}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" />분석 중...</> : '경쟁도 분석하기'}
        </button>
      </div>
    )
  }

  const config = levelConfig[data.competitionLevel]
  const Icon = config.icon

  return (
    <div className={`border rounded-lg p-4 ${config.color}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5" />
        <h3 className="font-semibold">경쟁도: {config.label}</h3>
        <span className="ml-auto text-lg font-bold">{data.competitionScore}점</span>
      </div>
      <p className="text-sm mb-2">{data.estimatedApplicants}</p>
      <div className="space-y-1 mb-3">
        {Object.values(data.factors).map((f, i) => (
          <p key={i} className="text-xs opacity-80">• {f}</p>
        ))}
      </div>
      <p className="text-sm font-medium">{data.recommendation}</p>
    </div>
  )
}

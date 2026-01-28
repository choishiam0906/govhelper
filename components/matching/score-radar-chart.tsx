'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// recharts를 동적으로 로드하여 초기 번들 크기 감소
const Radar = dynamic(() => import('recharts').then(mod => mod.Radar), { ssr: false })
const RadarChart = dynamic(() => import('recharts').then(mod => mod.RadarChart), { ssr: false })
const PolarGrid = dynamic(() => import('recharts').then(mod => mod.PolarGrid), { ssr: false })
const PolarAngleAxis = dynamic(() => import('recharts').then(mod => mod.PolarAngleAxis), { ssr: false })
const PolarRadiusAxis = dynamic(() => import('recharts').then(mod => mod.PolarRadiusAxis), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), {
  ssr: false,
  loading: () => <Skeleton className="h-[280px] w-full" />
})
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })

interface ScoreRadarChartProps {
  technicalScore: number
  marketScore: number
  businessScore: number
  fitScore: number
  bonusPoints: number
}

export function ScoreRadarChart({
  technicalScore,
  marketScore,
  businessScore,
  fitScore,
  bonusPoints,
}: ScoreRadarChartProps) {
  // 각 항목을 100점 만점으로 정규화
  const data = [
    {
      subject: '기술성',
      score: Math.round((technicalScore / 25) * 100),
      fullMark: 100,
      originalScore: technicalScore,
      maxScore: 25,
    },
    {
      subject: '시장성',
      score: Math.round((marketScore / 20) * 100),
      fullMark: 100,
      originalScore: marketScore,
      maxScore: 20,
    },
    {
      subject: '사업성',
      score: Math.round((businessScore / 20) * 100),
      fullMark: 100,
      originalScore: businessScore,
      maxScore: 20,
    },
    {
      subject: '공고부합도',
      score: Math.round((fitScore / 25) * 100),
      fullMark: 100,
      originalScore: fitScore,
      maxScore: 25,
    },
    {
      subject: '가점',
      score: Math.round((bonusPoints / 10) * 100),
      fullMark: 100,
      originalScore: bonusPoints,
      maxScore: 10,
    },
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.subject}</p>
          <p className="text-sm text-muted-foreground">
            {data.originalScore}/{data.maxScore}점 ({data.score}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid strokeDasharray="3 3" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickCount={5}
        />
        <Radar
          name="점수"
          dataKey="score"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

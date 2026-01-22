'use client'

import { useEffect, useState } from 'react'

interface Statistics {
  totalMatches: number
  avgMatchScore: number
  successRate: number
  totalAnnouncements: number
  activeAnnouncements: number
  avgSupportAmount: number
  avgSupportAmountFormatted: string
  totalCompanies: number
  totalGuestMatches: number
  analysisTime: number
  satisfactionRate: number
}

const defaultStats: Statistics = {
  totalMatches: 200,
  avgMatchScore: 78,
  successRate: 78,
  totalAnnouncements: 500,
  activeAnnouncements: 300,
  avgSupportAmount: 30000000,
  avgSupportAmountFormatted: '3,000만원',
  totalCompanies: 50,
  totalGuestMatches: 100,
  analysisTime: 30,
  satisfactionRate: 94,
}

// 숫자 애니메이션 훅
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      // easeOutQuart for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOut * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration])

  return count
}

// 개별 통계 카드 컴포넌트
function StatCard({ value, suffix, label, animate = true }: {
  value: number | string
  suffix?: string
  label: string
  animate?: boolean
}) {
  const numericValue = typeof value === 'number' ? value : parseInt(value.replace(/[^0-9]/g, '')) || 0
  const animatedValue = useCountUp(animate && typeof value === 'number' ? numericValue : 0)

  const displayValue = animate && typeof value === 'number'
    ? animatedValue.toLocaleString()
    : value

  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-primary">
        {displayValue}{suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

export function StatsSection() {
  const [stats, setStats] = useState<Statistics>(defaultStats)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/statistics')
        const result = await response.json()

        if (result.success && result.data) {
          setStats(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
        // 에러 시 기본값 유지
      } finally {
        setIsLoaded(true)
      }
    }

    fetchStats()
  }, [])

  return (
    <section className="border-y bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard
            value={stats.avgSupportAmountFormatted}
            label="평균 선정 지원금"
            animate={false}
          />
          <StatCard
            value={stats.successRate}
            suffix="%"
            label="매칭 후 선정률"
            animate={isLoaded}
          />
          <StatCard
            value={stats.totalAnnouncements}
            suffix="+"
            label="분석 가능 공고"
            animate={isLoaded}
          />
          <StatCard
            value={stats.analysisTime}
            suffix="초"
            label="매칭 소요 시간"
            animate={isLoaded}
          />
        </div>
      </div>
    </section>
  )
}

// AI 전문성 섹션용 통계
export function AIExpertiseStats() {
  const [stats, setStats] = useState<Statistics>(defaultStats)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/statistics')
        const result = await response.json()

        if (result.success && result.data) {
          setStats(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <p className="text-muted-foreground max-w-2xl mx-auto">
      GovHelper AI는 실제 <span className="font-semibold text-foreground">{stats.totalMatches}건 이상의 매칭 분석</span>과
      <span className="font-semibold text-foreground"> {stats.totalAnnouncements.toLocaleString()}개 이상의 공고 데이터</span>를 학습했습니다.
    </p>
  )
}

// Hero 섹션용 통계
export function HeroStats() {
  const [stats, setStats] = useState<Statistics>(defaultStats)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/statistics')
        const result = await response.json()

        if (result.success && result.data) {
          setStats(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
      }
    }

    fetchStats()
  }, [])

  return {
    avgSupportAmount: stats.avgSupportAmountFormatted,
    analysisTime: stats.analysisTime,
  }
}

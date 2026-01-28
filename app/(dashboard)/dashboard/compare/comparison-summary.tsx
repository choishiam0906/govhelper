'use client'

import { Star, Coins, Calendar, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { CompareAnnouncement } from '@/stores/compare-store'
import { parseAmount, getDaysLeft } from './utils'

interface ComparisonSummaryProps {
  announcements: CompareAnnouncement[]
  maxAmount: number
  latestEnd: number
  evalCount: number
  eligCount: number
}

export function ComparisonSummary({
  announcements,
  maxAmount,
  latestEnd,
  evalCount,
  eligCount,
}: ComparisonSummaryProps) {
  const bestAmountAnnouncement = announcements.find((a) => parseAmount(a.support_amount) === maxAmount)
  const latestEndAnnouncement = announcements.find(
    (a) => a.application_end && new Date(a.application_end).getTime() === latestEnd
  )

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          비교 요약
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {/* 최고 지원금액 */}
          <div className="p-4 bg-background rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Coins className="h-4 w-4" />
              최고 지원금액
            </div>
            {bestAmountAnnouncement ? (
              <div>
                <p className="font-bold text-lg text-green-600">{bestAmountAnnouncement.support_amount}</p>
                <p className="text-sm text-muted-foreground truncate">{bestAmountAnnouncement.title}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">-</p>
            )}
          </div>

          {/* 마감 여유 */}
          <div className="p-4 bg-background rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              마감 여유
            </div>
            {latestEndAnnouncement ? (
              <div>
                <p className="font-bold text-lg text-blue-600">D-{getDaysLeft(latestEndAnnouncement.application_end)}</p>
                <p className="text-sm text-muted-foreground truncate">{latestEndAnnouncement.title}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">-</p>
            )}
          </div>

          {/* 평가기준/자격조건 */}
          <div className="p-4 bg-background rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <FileText className="h-4 w-4" />
              상세 정보
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  평가기준
                </Badge>
                <span className="text-sm">{evalCount}개 공고</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  자격조건
                </Badge>
                <span className="text-sm">{eligCount}개 공고</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <p className="text-sm text-muted-foreground text-center">
          AI 매칭 분석을 받으면 각 공고가 우리 기업에 얼마나 적합한지 자세히 알 수 있어요
        </p>
      </CardContent>
    </Card>
  )
}

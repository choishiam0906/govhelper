'use client'

import Link from 'next/link'
import {
  Trash2,
  Star,
  Award,
  Calendar,
  Coins,
  Clock,
  Building2,
  ExternalLink,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { CompareAnnouncement } from '@/stores/compare-store'
import { sourceLabels, sourceColors } from './types'
import { formatDate, getDaysLeft } from './utils'

interface AnnouncementCardProps {
  announcement: CompareAnnouncement
  score: number
  isBestAmount: boolean
  isLatestEnd: boolean
  onRemove: (id: string) => void
  showRemove?: boolean
}

export function AnnouncementCard({
  announcement,
  score,
  isBestAmount,
  isLatestEnd,
  onRemove,
  showRemove = true,
}: AnnouncementCardProps) {
  const daysLeft = getDaysLeft(announcement.application_end)

  return (
    <Card className="relative">
      {showRemove && (
        <button
          onClick={() => onRemove(announcement.id)}
          className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors z-10"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {/* 추천 점수 */}
      <div className="absolute top-2 left-2 z-10">
        <div className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
          <Star className="h-3 w-3 fill-current" />
          {score}점
        </div>
      </div>

      <CardHeader className="pt-10 pb-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge
            variant="secondary"
            className={`${sourceColors[announcement.source] || ''}`}
          >
            {sourceLabels[announcement.source] || announcement.source}
          </Badge>
          {isBestAmount && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              <Award className="h-3 w-3 mr-1" />
              최고 금액
            </Badge>
          )}
          {isLatestEnd && (
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
              <Calendar className="h-3 w-3 mr-1" />
              마감 여유
            </Badge>
          )}
        </div>
        <CardTitle className="text-base line-clamp-2 pr-6 min-h-[48px]">
          {announcement.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Coins className="h-3.5 w-3.5" />
              지원금액
            </span>
            <span className={`font-medium ${isBestAmount ? 'text-green-600' : ''}`}>
              {announcement.support_amount || '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              마감일
            </span>
            <div className="flex items-center gap-2">
              <span>{formatDate(announcement.application_end)}</span>
              {daysLeft !== null && daysLeft >= 0 && (
                <Badge
                  variant={daysLeft <= 7 ? 'destructive' : daysLeft <= 14 ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  D-{daysLeft}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              주관기관
            </span>
            <span className="truncate max-w-[150px]">{announcement.organization || '-'}</span>
          </div>
        </div>

        <Separator />

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href={`/dashboard/announcements/${announcement.id}`}>
              <ExternalLink className="h-4 w-4 mr-1" />
              상세
            </Link>
          </Button>
          <Button size="sm" asChild className="flex-1">
            <Link href={`/dashboard/matching?announcementId=${announcement.id}`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              매칭
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

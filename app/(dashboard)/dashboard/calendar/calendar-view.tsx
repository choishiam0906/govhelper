'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Bookmark, Building2, Coins, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Announcement {
  id: string
  title: string
  organization: string | null
  application_end: string | null
  source: string
  support_amount: string | null
  isSaved: boolean
}

interface CalendarViewProps {
  year: number
  month: number
  items: Announcement[]
}

// 출처 라벨
const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  smes: '중소벤처24',
  g2b: '나라장터',
}

// 출처별 색상
const sourceColors: Record<string, string> = {
  bizinfo: 'bg-blue-500',
  kstartup: 'bg-green-500',
  smes: 'bg-purple-500',
  g2b: 'bg-orange-500',
}

export function CalendarView({ year, month, items }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // 클라이언트에서 날짜별로 그룹화
  const eventsByDate: Record<string, Announcement[]> = {}
  items.forEach(item => {
    if (item.application_end) {
      const dateKey = item.application_end.substring(0, 10)
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = []
      }
      eventsByDate[dateKey].push(item)
    }
  })

  // 해당 월의 첫째 날과 마지막 날
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay() // 0 = 일요일

  // 오늘 날짜
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // 달력 날짜 생성
  const days: (number | null)[] = []

  // 이전 달 빈 칸
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }

  // 해당 달 날짜
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  // 날짜 클릭 핸들러
  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (eventsByDate[dateStr] && eventsByDate[dateStr].length > 0) {
      setSelectedDate(dateStr)
      setDialogOpen(true)
    }
  }

  // 요일 헤더
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <>
      <div className="border rounded-lg overflow-hidden min-w-[600px]">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-muted">
          {weekdays.map((day, index) => (
            <div
              key={day}
              className={cn(
                'py-2 text-center text-sm font-medium',
                index === 0 && 'text-red-500',
                index === 6 && 'text-blue-500'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[100px] border-t border-r bg-muted/30" />
            }

            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const events = eventsByDate[dateStr] || []
            const isToday = dateStr === todayStr
            const dayOfWeek = (startingDayOfWeek + day - 1) % 7
            const isSunday = dayOfWeek === 0
            const isSaturday = dayOfWeek === 6

            return (
              <div
                key={day}
                className={cn(
                  'min-h-[100px] border-t border-r p-1 cursor-pointer hover:bg-muted/50 transition-colors',
                  events.length > 0 && 'bg-primary/5'
                )}
                onClick={() => handleDateClick(day)}
              >
                {/* 날짜 */}
                <div className={cn(
                  'text-sm mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                  isToday && 'bg-primary text-primary-foreground font-bold',
                  !isToday && isSunday && 'text-red-500',
                  !isToday && isSaturday && 'text-blue-500'
                )}>
                  {day}
                </div>

                {/* 이벤트 표시 */}
                <div className="space-y-1">
                  {events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded truncate text-white',
                        sourceColors[event.source] || 'bg-gray-500'
                      )}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1">
                      +{events.length - 3}개 더
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {Object.entries(sourceLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-sm">
            <div className={cn('w-3 h-3 rounded', sourceColors[key])} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* 날짜 상세 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && new Date(selectedDate).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })} 마감 공고
            </DialogTitle>
            <DialogDescription>
              해당 날짜에 마감되는 공고 목록이에요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedDate && eventsByDate[selectedDate]?.map((event) => (
              <div
                key={event.id}
                className="p-3 border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {event.isSaved && (
                        <Bookmark className="h-4 w-4 text-primary fill-primary flex-shrink-0" />
                      )}
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs text-white flex-shrink-0',
                          sourceColors[event.source]
                        )}
                      >
                        {sourceLabels[event.source] || event.source}
                      </Badge>
                    </div>
                    <h4 className="font-medium line-clamp-2">{event.title}</h4>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {event.organization && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {event.organization}
                        </span>
                      )}
                      {event.support_amount && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Coins className="h-3 w-3" />
                          {event.support_amount}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="flex-shrink-0">
                    <Link href={`/dashboard/announcements/${event.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

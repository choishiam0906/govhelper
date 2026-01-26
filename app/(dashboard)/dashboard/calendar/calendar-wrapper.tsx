'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CalendarView } from './calendar-view'
import { Grid3X3, List } from 'lucide-react'
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

interface CalendarWrapperProps {
  year: number
  month: number
  items: Announcement[]
}

export function CalendarWrapper({ year, month, items }: CalendarWrapperProps) {
  const [viewMode, setViewMode] = useState<'events' | 'heatmap'>('events')

  return (
    <div>
      {/* 뷰 모드 토글 */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <span className="text-sm text-muted-foreground mr-2">보기 모드:</span>
        <div className="flex rounded-lg border p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 px-3',
              viewMode === 'events' && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            onClick={() => setViewMode('events')}
          >
            <List className="h-4 w-4 mr-1.5" />
            이벤트
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 px-3',
              viewMode === 'heatmap' && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            onClick={() => setViewMode('heatmap')}
          >
            <Grid3X3 className="h-4 w-4 mr-1.5" />
            히트맵
          </Button>
        </div>
      </div>

      {/* 캘린더 뷰 */}
      <CalendarView
        key={`calendar-${year}-${month}-${viewMode}`}
        year={year}
        month={month}
        items={items}
        viewMode={viewMode}
      />
    </div>
  )
}

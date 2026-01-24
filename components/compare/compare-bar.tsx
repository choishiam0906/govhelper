'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, GitCompare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCompareStore } from '@/stores/compare-store'

export function CompareBar() {
  const { announcements, removeAnnouncement, clearAll } = useCompareStore()
  const [mounted, setMounted] = useState(false)

  // 클라이언트 사이드에서만 렌더링 (hydration 문제 방지)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || announcements.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      <div className="bg-card border shadow-lg rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            <span className="font-medium">비교 목록</span>
            <Badge variant="secondary">{announcements.length}/3</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              전체 삭제
            </Button>
            <Button asChild size="sm" disabled={announcements.length < 2}>
              <Link href="/dashboard/compare">
                비교하기
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 text-sm"
            >
              <span className="truncate max-w-[200px]">{announcement.title}</span>
              <button
                onClick={() => removeAnnouncement(announcement.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* 빈 슬롯 표시 */}
          {Array.from({ length: 3 - announcements.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-2 border border-dashed rounded-md px-3 py-1.5 text-sm text-muted-foreground"
            >
              공고 선택
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

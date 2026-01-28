'use client'

import { useRouter } from 'next/navigation'
import { GitCompare, ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CompareHeaderProps {
  announcementCount: number
  onClearAll: () => void
}

export function CompareHeader({ announcementCount, onClearAll }: CompareHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GitCompare className="h-8 w-8" />
            공고 비교
          </h1>
          <p className="text-muted-foreground mt-1">
            {announcementCount}개 공고를 비교하고 있어요
          </p>
        </div>
      </div>

      <Button variant="outline" onClick={onClearAll}>
        <Trash2 className="h-4 w-4 mr-2" />
        전체 삭제
      </Button>
    </div>
  )
}

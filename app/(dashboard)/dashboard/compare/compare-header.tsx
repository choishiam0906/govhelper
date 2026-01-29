'use client'

import { useRouter } from 'next/navigation'
import { GitCompare, ArrowLeft, Trash2, Share2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CompareHeaderProps {
  announcementCount: number
  announcementIds: string[]
  onClearAll: () => void
  isSharedView?: boolean
  onAddToMyCompare?: () => void
}

export function CompareHeader({
  announcementCount,
  announcementIds,
  onClearAll,
  isSharedView = false,
  onAddToMyCompare,
}: CompareHeaderProps) {
  const router = useRouter()

  const handleShareLink = () => {
    const url = `${window.location.origin}/dashboard/compare?ids=${announcementIds.join(',')}`
    navigator.clipboard.writeText(url)
    toast.success('공유 링크를 복사했어요')
  }

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
            {isSharedView && (
              <span className="text-base font-normal text-muted-foreground">(공유됨)</span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {announcementCount}개 공고를 비교하고 있어요
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleShareLink}>
          <Share2 className="h-4 w-4 mr-2" />
          공유 링크 복사
        </Button>
        {isSharedView ? (
          <Button onClick={onAddToMyCompare}>
            <Plus className="h-4 w-4 mr-2" />
            내 비교에 추가
          </Button>
        ) : (
          <Button variant="outline" onClick={onClearAll}>
            <Trash2 className="h-4 w-4 mr-2" />
            전체 삭제
          </Button>
        )}
      </div>
    </div>
  )
}

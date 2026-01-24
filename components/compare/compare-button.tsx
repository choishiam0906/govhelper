'use client'

import { useState, useEffect } from 'react'
import { GitCompare, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCompareStore, CompareAnnouncement } from '@/stores/compare-store'
import { toast } from 'sonner'

interface CompareButtonProps {
  announcement: CompareAnnouncement
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function CompareButton({
  announcement,
  variant = 'outline',
  size = 'sm',
}: CompareButtonProps) {
  const { addAnnouncement, removeAnnouncement, isInCompare, announcements } = useCompareStore()
  const [mounted, setMounted] = useState(false)
  const [inCompare, setInCompare] = useState(false)

  useEffect(() => {
    setMounted(true)
    setInCompare(isInCompare(announcement.id))
  }, [announcement.id, isInCompare, announcements])

  if (!mounted) {
    return (
      <Button variant={variant} size={size} disabled>
        <GitCompare className="h-4 w-4 mr-1" />
        비교
      </Button>
    )
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (inCompare) {
      removeAnnouncement(announcement.id)
      setInCompare(false)
      toast.success('비교 목록에서 제거했어요')
    } else {
      const added = addAnnouncement(announcement)
      if (added) {
        setInCompare(true)
        toast.success('비교 목록에 추가했어요')
      } else {
        toast.error('최대 3개까지 비교할 수 있어요')
      }
    }
  }

  return (
    <Button
      variant={inCompare ? 'default' : variant}
      size={size}
      onClick={handleClick}
      className={inCompare ? 'bg-primary' : ''}
    >
      {inCompare ? (
        <>
          <Check className="h-4 w-4 mr-1" />
          비교 중
        </>
      ) : (
        <>
          <GitCompare className="h-4 w-4 mr-1" />
          비교
        </>
      )}
    </Button>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'
import { useTutorial } from './tutorial-provider'

export function TutorialTrigger() {
  const { startTutorial, hasCompletedTutorial } = useTutorial()

  // 튜토리얼 완료한 사용자에게만 다시 보기 버튼 표시
  if (!hasCompletedTutorial) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={startTutorial}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <HelpCircle className="h-4 w-4" />
      <span className="hidden sm:inline">가이드 다시 보기</span>
    </Button>
  )
}

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles } from 'lucide-react'

interface AIImproveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionTitle: string
  currentContent: string
  onImprove: (feedback: string) => Promise<void>
}

const PRESET_FEEDBACKS = [
  '더 전문적이고 설득력 있게 작성해주세요',
  '구체적인 수치와 데이터를 추가해주세요',
  '문장을 더 간결하게 다듬어주세요',
  '평가위원 관점에서 어필할 수 있도록 수정해주세요',
]

export function AIImproveDialog({
  open,
  onOpenChange,
  sectionTitle,
  currentContent,
  onImprove,
}: AIImproveDialogProps) {
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  const handleImprove = async () => {
    if (!feedback.trim()) return

    setLoading(true)
    try {
      await onImprove(feedback)
      setFeedback('')
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handlePresetClick = (preset: string) => {
    setFeedback(preset)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 개선 요청
          </DialogTitle>
          <DialogDescription>
            &quot;{sectionTitle}&quot; 섹션을 AI가 개선합니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 현재 내용 미리보기 */}
          <div>
            <Label className="text-muted-foreground text-xs">현재 내용</Label>
            <div className="mt-1 p-3 bg-muted rounded-lg max-h-32 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap line-clamp-5">
                {currentContent}
              </p>
            </div>
          </div>

          {/* 프리셋 버튼 */}
          <div className="flex flex-wrap gap-2">
            {PRESET_FEEDBACKS.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(preset)}
                className="text-xs"
              >
                {preset}
              </Button>
            ))}
          </div>

          {/* 피드백 입력 */}
          <div>
            <Label htmlFor="feedback">개선 요청사항</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="어떻게 개선하면 좋을지 설명해주세요..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            onClick={handleImprove}
            disabled={loading || !feedback.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                개선 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                AI 개선
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

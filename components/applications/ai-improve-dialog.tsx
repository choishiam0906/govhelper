'use client'

import { useState, useEffect } from 'react'
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
import { Loader2, Sparkles, Check, Copy } from 'lucide-react'
import { useStreaming } from '@/lib/hooks/use-streaming'
import { toast } from 'sonner'

interface AIImproveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
  sectionIndex: number
  sectionTitle: string
  currentContent: string
  onImproveComplete: (newContent: string) => void
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
  applicationId,
  sectionIndex,
  sectionTitle,
  currentContent,
  onImproveComplete,
}: AIImproveDialogProps) {
  const [feedback, setFeedback] = useState('')
  const [showResult, setShowResult] = useState(false)

  const { isStreaming, content, error, startStream, reset } = useStreaming({
    onComplete: (fullContent) => {
      onImproveComplete(fullContent)
      toast.success('AI 개선이 완료됐어요')
    },
    onError: (error) => {
      toast.error(error)
    },
  })

  // 다이얼로그 닫힐 때 초기화
  useEffect(() => {
    if (!open) {
      setFeedback('')
      setShowResult(false)
      reset()
    }
  }, [open, reset])

  const handleImprove = async () => {
    if (!feedback.trim()) return

    setShowResult(true)
    await startStream(`/api/applications/${applicationId}/improve/stream`, {
      sectionIndex,
      currentContent,
      feedback: feedback.trim(),
    })
  }

  const handlePresetClick = (preset: string) => {
    setFeedback(preset)
  }

  const handleCopyResult = async () => {
    await navigator.clipboard.writeText(content)
    toast.success('클립보드에 복사했어요')
  }

  const handleApplyAndClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI 개선 요청
          </DialogTitle>
          <DialogDescription>
            &quot;{sectionTitle}&quot; 섹션을 AI가 개선합니다
          </DialogDescription>
        </DialogHeader>

        {!showResult ? (
          // 피드백 입력 화면
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

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button
                onClick={handleImprove}
                disabled={!feedback.trim()}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI 개선
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // 스트리밍 결과 화면
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-2">
                  {isStreaming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-primary">AI가 작성 중...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">개선 완료</span>
                    </>
                  )}
                </Label>
                {!isStreaming && content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyResult}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    복사
                  </Button>
                )}
              </div>
              <div className="p-4 bg-muted rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">
                  {content || (
                    <span className="text-muted-foreground">
                      응답을 기다리는 중...
                    </span>
                  )}
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  )}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResult(false)
                  reset()
                }}
                disabled={isStreaming}
              >
                다시 요청
              </Button>
              <Button
                onClick={handleApplyAndClose}
                disabled={isStreaming || !content}
              >
                <Check className="h-4 w-4 mr-2" />
                적용 완료
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// 하위 호환성을 위한 기존 인터페이스 지원
interface LegacyAIImproveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionTitle: string
  currentContent: string
  onImprove: (feedback: string) => Promise<void>
}

export function LegacyAIImproveDialog({
  open,
  onOpenChange,
  sectionTitle,
  currentContent,
  onImprove,
}: LegacyAIImproveDialogProps) {
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
          <div>
            <Label className="text-muted-foreground text-xs">현재 내용</Label>
            <div className="mt-1 p-3 bg-muted rounded-lg max-h-32 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap line-clamp-5">
                {currentContent}
              </p>
            </div>
          </div>

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

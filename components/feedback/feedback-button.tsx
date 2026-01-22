'use client'

import { useState } from 'react'
import { MessageSquarePlus, X, Send, Bug, Lightbulb, MessageCircle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const feedbackTypes = [
  { id: 'bug', label: '버그 신고', icon: Bug, color: 'text-red-500' },
  { id: 'feature', label: '기능 요청', icon: Lightbulb, color: 'text-yellow-500' },
  { id: 'general', label: '일반 의견', icon: MessageCircle, color: 'text-blue-500' },
  { id: 'other', label: '기타', icon: HelpCircle, color: 'text-gray-500' },
] as const

type FeedbackType = typeof feedbackTypes[number]['id']

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('general')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setType('general')
    setSubject('')
    setMessage('')
    setEmail('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (message.length < 10) {
      toast.error('피드백은 10자 이상 입력해 주세요')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          subject: subject || undefined,
          message,
          email: email || undefined,
          pageUrl: window.location.href,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('소중한 피드백 감사해요!')
        setOpen(false)
        resetForm()
      } else {
        toast.error(data.error || '피드백 전송에 실패했어요')
      }
    } catch (error) {
      toast.error('네트워크 오류가 발생했어요')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
        aria-label="피드백 보내기"
      >
        <MessageSquarePlus className="w-6 h-6" />
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-foreground text-background text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          피드백 보내기
        </span>
      </button>

      {/* 피드백 모달 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5" />
              피드백 보내기
            </DialogTitle>
            <DialogDescription>
              서비스 개선에 도움이 되는 의견을 보내주세요
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* 피드백 유형 선택 */}
            <div className="space-y-2">
              <Label>피드백 유형</Label>
              <div className="grid grid-cols-4 gap-2">
                {feedbackTypes.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                        type === item.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/30'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', item.color)} />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 제목 (선택) */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                제목 <span className="text-muted-foreground text-xs">(선택)</span>
              </Label>
              <Input
                id="subject"
                placeholder="간단한 제목을 입력해 주세요"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={255}
              />
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <Label htmlFor="message">
                내용 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                placeholder={
                  type === 'bug'
                    ? '어떤 문제가 발생했나요? 재현 방법도 알려주시면 좋아요'
                    : type === 'feature'
                    ? '어떤 기능이 있으면 좋을까요?'
                    : '서비스에 대한 의견을 자유롭게 작성해 주세요'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={2000}
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/2000
              </p>
            </div>

            {/* 이메일 (선택) */}
            <div className="space-y-2">
              <Label htmlFor="email">
                이메일 <span className="text-muted-foreground text-xs">(답변 받기)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="답변을 받으실 이메일 (선택)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting || message.length < 10}>
                {isSubmitting ? (
                  '보내는 중...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    보내기
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

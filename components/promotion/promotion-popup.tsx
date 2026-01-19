'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gift, Crown, Sparkles, Calendar, Check } from 'lucide-react'

interface PromotionPopupProps {
  promotionName: string
  promotionDescription: string
  endDate: string
  daysRemaining: number
}

const POPUP_STORAGE_KEY = 'govhelper_promotion_popup_seen'

export function PromotionPopup({
  promotionName,
  promotionDescription,
  endDate,
  daysRemaining,
}: PromotionPopupProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // 이미 본 팝업인지 확인 (하루에 한 번만 표시)
    const lastSeen = localStorage.getItem(POPUP_STORAGE_KEY)
    const today = new Date().toDateString()

    if (lastSeen !== today) {
      // 500ms 후에 팝업 표시 (페이지 로드 후)
      const timer = setTimeout(() => {
        setOpen(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem(POPUP_STORAGE_KEY, new Date().toDateString())
    setOpen(false)
  }

  const proFeatures = [
    'AI 매칭 분석 무제한',
    'AI 지원서 작성',
    'AI 섹션별 개선',
    'PDF 다운로드',
    '우선 고객 지원',
  ]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            {promotionName}
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {promotionDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pro 플랜 배지 */}
          <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
            <Crown className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-primary">Pro 플랜</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              무료
            </Badge>
          </div>

          {/* 기간 정보 */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(endDate).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              까지
            </span>
            <Badge variant="outline" className="ml-1">
              D-{daysRemaining}
            </Badge>
          </div>

          {/* Pro 기능 목록 */}
          <div className="border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              포함된 Pro 기능
            </p>
            {proFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* 안내 문구 */}
          <p className="text-xs text-center text-muted-foreground">
            별도의 가입이나 결제 없이 자동으로 적용됩니다
          </p>
        </div>

        <Button onClick={handleClose} className="w-full" size="lg">
          시작하기
        </Button>
      </DialogContent>
    </Dialog>
  )
}

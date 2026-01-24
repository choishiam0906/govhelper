'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Mail, CheckCircle } from 'lucide-react'

interface NewsletterFormProps {
  source?: 'landing' | 'footer' | 'popup' | 'try_page'
  className?: string
  variant?: 'default' | 'inline'
}

export function NewsletterForm({ source = 'landing', className = '', variant = 'default' }: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('이메일 주소를 입력해 주세요')
      return
    }

    setIsLoading(true)

    try {
      // UTM 파라미터 가져오기
      const urlParams = new URLSearchParams(window.location.search)

      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source,
          utm_source: urlParams.get('utm_source'),
          utm_medium: urlParams.get('utm_medium'),
          utm_campaign: urlParams.get('utm_campaign'),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
        setEmail('')
        toast.success('인증 이메일을 발송했어요! 메일함을 확인해 주세요.')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('구독 신청에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm">인증 이메일을 발송했어요!</span>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <Input
          type="email"
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '구독'}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="이메일 주소를 입력하세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10"
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            구독 신청 중...
          </>
        ) : (
          '뉴스레터 구독하기'
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        매주 엄선된 정부지원사업 정보와 지원 꿀팁을 보내드려요
      </p>
    </form>
  )
}

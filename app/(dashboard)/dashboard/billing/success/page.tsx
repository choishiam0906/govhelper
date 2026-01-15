'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, Crown } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const confirmPayment = async () => {
      const method = searchParams.get('method')
      const paymentKey = searchParams.get('paymentKey')
      const orderId = searchParams.get('orderId')
      const amount = searchParams.get('amount')

      // 토스 결제인 경우 승인 처리
      if (method === 'toss' && paymentKey && orderId && amount) {
        try {
          const response = await fetch('/api/payments/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'toss',
              paymentKey,
              orderId,
              amount: parseInt(amount),
            }),
          })

          const result = await response.json()

          if (!result.success) {
            throw new Error(result.error || '결제 승인에 실패했어요')
          }

          setSuccess(true)
          toast.success('Pro 구독이 시작됐어요!')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '결제 처리에 실패했어요')
          router.push('/dashboard/billing/fail')
          return
        }
      } else {
        // 카카오/네이버는 이미 서버에서 처리됨
        setSuccess(true)
      }

      setLoading(false)
    }

    confirmPayment()
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">결제 처리 중...</h2>
            <p className="text-muted-foreground mt-2">잠시만 기다려주세요.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">결제가 완료됐어요!</CardTitle>
          <CardDescription>
            GovHelper Pro 구독이 시작됐어요
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-primary" />
              <span className="font-semibold">Pro 플랜 활성화</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>무제한 AI 매칭 분석</li>
              <li>AI 지원서 작성</li>
              <li>우선 고객 지원</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/dashboard/matching">
                AI 매칭 시작하기
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                대시보드로 이동
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function PaymentFailPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const code = searchParams.get('code')
  const message = searchParams.get('message')

  const getErrorMessage = () => {
    if (message) return decodeURIComponent(message)

    switch (error) {
      case 'auth':
        return '인증에 실패했습니다. 다시 로그인해주세요.'
      case 'not_found':
        return '결제 정보를 찾을 수 없습니다.'
      case 'invalid_params':
        return '결제 정보가 올바르지 않습니다.'
      case 'server':
        return '서버 오류가 발생했습니다.'
      default:
        return '결제 처리 중 문제가 발생했습니다.'
    }
  }

  return (
    <div className="max-w-lg mx-auto py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">결제에 실패했습니다</CardTitle>
          <CardDescription>
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {code && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                오류 코드: {code}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/dashboard/billing/checkout">
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 시도하기
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/billing">
                결제 관리로 돌아가기
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            계속 문제가 발생하면{' '}
            <a href="mailto:support@govhelper.kr" className="text-primary hover:underline">
              고객센터
            </a>
            로 문의해주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

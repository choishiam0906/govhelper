import { MailX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: '수신 거부 완료',
}

export default function NewsletterUnsubscribedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MailX className="w-8 h-8 text-gray-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          수신 거부 처리됐어요
        </h1>
        <p className="text-gray-600 mb-6">
          뉴스레터 수신이 중단됐어요.<br />
          언제든지 다시 구독하실 수 있어요.
        </p>
        <Button asChild variant="outline">
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    </div>
  )
}

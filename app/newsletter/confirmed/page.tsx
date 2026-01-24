import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: '구독 확인 완료',
}

export default function NewsletterConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          구독이 확인됐어요!
        </h1>
        <p className="text-gray-600 mb-6">
          GovHelper 뉴스레터 구독이 완료됐어요.<br />
          매주 유용한 정부지원사업 정보를 보내드릴게요.
        </p>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/">홈으로 돌아가기</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/register">회원가입하고 더 많은 기능 이용하기</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

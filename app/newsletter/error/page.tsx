import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: '오류 발생',
}

export default function NewsletterErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string }
}) {
  const getMessage = (reason?: string) => {
    switch (reason) {
      case 'invalid_token':
        return '유효하지 않거나 만료된 링크예요.'
      case 'server_error':
        return '서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
      default:
        return '알 수 없는 오류가 발생했어요.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          문제가 발생했어요
        </h1>
        <p className="text-gray-600 mb-6">
          {getMessage(searchParams.reason)}
        </p>
        <Button asChild>
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    </div>
  )
}

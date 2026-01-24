import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
  title: "오프라인",
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          인터넷 연결이 없어요
        </h1>
        <p className="text-gray-600 mb-6">
          네트워크 연결을 확인하고 다시 시도해 주세요.
        </p>
        <Button asChild>
          <Link href="/">다시 시도하기</Link>
        </Button>
      </div>
    </div>
  )
}

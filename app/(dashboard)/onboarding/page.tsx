'use client'

import { useRouter } from 'next/navigation'
import { CompanyForm } from '@/components/forms/company-form'
import { Building2, Sparkles } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()

  const handleSuccess = () => {
    // 서버 컴포넌트 캐시를 새로고침한 후 대시보드로 이동
    router.refresh()
    // 약간의 딜레이 후 이동하여 캐시 갱신 보장
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">환영합니다!</h1>
          <p className="text-muted-foreground text-lg">
            맞춤 정부지원사업을 찾기 위해 기업 정보를 등록해주세요
          </p>
        </div>

        {/* 안내 배너 */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-primary">AI가 최적의 지원사업을 찾아드립니다</p>
            <p className="text-sm text-muted-foreground mt-1">
              입력하신 기업 정보를 바탕으로 적합한 정부지원사업을 매칭해드립니다.
              정보가 상세할수록 더 정확한 추천을 받으실 수 있습니다.
            </p>
          </div>
        </div>

        {/* 기업 정보 폼 */}
        <CompanyForm onSuccess={handleSuccess} mode="create" />
      </div>
    </div>
  )
}

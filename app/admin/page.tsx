'use client'

import dynamic from 'next/dynamic'

// 관리자 대시보드를 동적으로 로드하여 초기 번들 크기 감소
const AdminDashboard = dynamic(() => import('./admin-dashboard').then(mod => ({ default: mod.AdminDashboard })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">대시보드 로딩 중...</p>
      </div>
    </div>
  )
})

export default function AdminPage() {
  return <AdminDashboard />
}

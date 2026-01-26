import { Metadata } from 'next'
import { TrendsTabView } from './trends-tab-view'

export const metadata: Metadata = {
  title: '지원사업 트렌드 | GovHelper',
  description: '정부지원사업 트렌드 분석 및 인사이트',
}

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">지원사업 트렌드</h1>
        <p className="text-muted-foreground">
          최근 6개월간 정부지원사업 트렌드와 인사이트를 확인하세요
        </p>
      </div>

      <TrendsTabView />
    </div>
  )
}

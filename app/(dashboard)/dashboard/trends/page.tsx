import { Metadata } from 'next'
import { TrendsClient } from './trends-client'

export const metadata: Metadata = {
  title: '트렌드 분석 | GovHelper',
  description: '최근 정부지원사업 공고 트렌드를 한눈에 확인해요',
}

export default function TrendsPage() {
  return <TrendsClient />
}

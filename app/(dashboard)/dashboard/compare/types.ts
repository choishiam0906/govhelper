import type { LucideIcon } from 'lucide-react'

// 기본 비교 항목 타입
export interface BasicField {
  key: string
  label: string
  icon: LucideIcon | null
  highlight?: boolean
}

// 출처 라벨
export const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  smes: '중소벤처24',
  g2b: '나라장터',
}

// 출처별 색상
export const sourceColors: Record<string, string> = {
  bizinfo: 'bg-blue-100 text-blue-700',
  kstartup: 'bg-green-100 text-green-700',
  smes: 'bg-purple-100 text-purple-700',
  g2b: 'bg-orange-100 text-orange-700',
}

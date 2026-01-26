// 상태 타입
export type ApplicationStatus =
  | 'interested'
  | 'preparing'
  | 'submitted'
  | 'under_review'
  | 'passed_initial'
  | 'passed_final'
  | 'rejected'
  | 'cancelled'

// 상태 정보
export const STATUS_INFO: Record<ApplicationStatus, { label: string; color: string; description: string }> = {
  interested: { label: '관심', color: 'bg-gray-500', description: '관심 등록한 공고' },
  preparing: { label: '준비 중', color: 'bg-blue-500', description: '지원 준비 중' },
  submitted: { label: '지원 완료', color: 'bg-indigo-500', description: '지원서 제출 완료' },
  under_review: { label: '심사 중', color: 'bg-yellow-500', description: '심사 진행 중' },
  passed_initial: { label: '1차 합격', color: 'bg-emerald-500', description: '1차 심사 통과' },
  passed_final: { label: '최종 합격', color: 'bg-green-500', description: '최종 선정' },
  rejected: { label: '탈락', color: 'bg-red-500', description: '선정 탈락' },
  cancelled: { label: '취소', color: 'bg-gray-400', description: '지원 취소' },
}

// 파이프라인 순서
export const PIPELINE_ORDER: ApplicationStatus[] = [
  'interested',
  'preparing',
  'submitted',
  'under_review',
  'passed_initial',
  'passed_final',
]

export const END_STATUSES: ApplicationStatus[] = ['rejected', 'cancelled']

// 추적 레코드 타입
export interface TrackingRecord {
  id: string
  status: ApplicationStatus
  memo: string | null
  created_at: string
  updated_at: string
  status_updated_at: string
  announcements: {
    id: string
    title: string
    organization: string
    application_start: string | null
    application_end: string | null
    support_amount: string | null
  }
}

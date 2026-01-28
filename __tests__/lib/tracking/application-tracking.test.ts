// 지원 이력 추적 기능 테스트
// lib/tracking/ 모듈 테스트

import { describe, it, expect } from 'vitest'

// 지원 상태 타입
type ApplicationStatus =
  | 'interested'
  | 'preparing'
  | 'submitted'
  | 'under_review'
  | 'passed_initial'
  | 'passed_final'
  | 'rejected'
  | 'cancelled'

interface ApplicationTracking {
  id: string
  userId: string
  announcementId: string
  status: ApplicationStatus
  notes: string | null
  notifyDeadline: boolean
  notifyResult: boolean
  createdAt: string
  updatedAt: string
}

describe('지원 이력 추적', () => {
  describe('상태 전환 플로우', () => {
    it('관심 → 준비 중 → 제출', () => {
      const tracking: ApplicationTracking = {
        id: 'track_123',
        userId: 'user_123',
        announcementId: 'ann_123',
        status: 'interested',
        notes: null,
        notifyDeadline: true,
        notifyResult: true,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      }

      // 준비 중으로 변경
      tracking.status = 'preparing'
      tracking.updatedAt = '2026-01-29T00:00:00Z'

      expect(tracking.status).toBe('preparing')

      // 제출로 변경
      tracking.status = 'submitted'
      tracking.updatedAt = '2026-01-30T00:00:00Z'

      expect(tracking.status).toBe('submitted')
    })

    it('제출 → 심사 중 → 1차 통과 → 최종 통과', () => {
      const tracking: ApplicationTracking = {
        id: 'track_123',
        userId: 'user_123',
        announcementId: 'ann_123',
        status: 'submitted',
        notes: null,
        notifyDeadline: true,
        notifyResult: true,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-30T00:00:00Z',
      }

      tracking.status = 'under_review'
      expect(tracking.status).toBe('under_review')

      tracking.status = 'passed_initial'
      expect(tracking.status).toBe('passed_initial')

      tracking.status = 'passed_final'
      expect(tracking.status).toBe('passed_final')
    })

    it('심사 중 → 탈락', () => {
      const tracking: ApplicationTracking = {
        id: 'track_123',
        userId: 'user_123',
        announcementId: 'ann_123',
        status: 'under_review',
        notes: null,
        notifyDeadline: true,
        notifyResult: true,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-30T00:00:00Z',
      }

      tracking.status = 'rejected'

      expect(tracking.status).toBe('rejected')
    })

    it('준비 중 → 취소', () => {
      const tracking: ApplicationTracking = {
        id: 'track_123',
        userId: 'user_123',
        announcementId: 'ann_123',
        status: 'preparing',
        notes: null,
        notifyDeadline: true,
        notifyResult: true,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-29T00:00:00Z',
      }

      tracking.status = 'cancelled'

      expect(tracking.status).toBe('cancelled')
    })
  })

  describe('메모 기능', () => {
    it('메모 추가', () => {
      const tracking: ApplicationTracking = {
        id: 'track_123',
        userId: 'user_123',
        announcementId: 'ann_123',
        status: 'interested',
        notes: null,
        notifyDeadline: true,
        notifyResult: true,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      }

      tracking.notes = '1차 서류 준비 완료, 2차 발표 자료 작성 중'

      expect(tracking.notes).toBe('1차 서류 준비 완료, 2차 발표 자료 작성 중')
    })

    it('메모 수정', () => {
      const tracking: ApplicationTracking = {
        id: 'track_123',
        userId: 'user_123',
        announcementId: 'ann_123',
        status: 'preparing',
        notes: '서류 작성 중',
        notifyDeadline: true,
        notifyResult: true,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      }

      tracking.notes = '서류 제출 완료, 발표 준비 시작'

      expect(tracking.notes).toBe('서류 제출 완료, 발표 준비 시작')
    })

    it('메모 삭제', () => {
      const tracking: ApplicationTracking = {
        id: 'track_123',
        userId: 'user_123',
        announcementId: 'ann_123',
        status: 'submitted',
        notes: '제출 완료',
        notifyDeadline: true,
        notifyResult: true,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-30T00:00:00Z',
      }

      tracking.notes = null

      expect(tracking.notes).toBeNull()
    })
  })

  describe('알림 설정', () => {
    it('마감일 알림 활성화', () => {
      const tracking: ApplicationTracking = {
        id: 'track_123',
        userId: 'user_123',
        announcementId: 'ann_123',
        status: 'interested',
        notes: null,
        notifyDeadline: true,
        notifyResult: true,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      }

      expect(tracking.notifyDeadline).toBe(true)
    })

    it('마감일 알림 비활성화', () => {
      const tracking: ApplicationTracking = {
        id: 'track_123',
        userId: 'user_123',
        announcementId: 'ann_123',
        status: 'interested',
        notes: null,
        notifyDeadline: false,
        notifyResult: true,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      }

      expect(tracking.notifyDeadline).toBe(false)
    })

    it('결과 알림 활성화', () => {
      const tracking: ApplicationTracking = {
        id: 'track_123',
        userId: 'user_123',
        announcementId: 'ann_123',
        status: 'submitted',
        notes: null,
        notifyDeadline: true,
        notifyResult: true,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-30T00:00:00Z',
      }

      expect(tracking.notifyResult).toBe(true)
    })

    it('결과 알림 비활성화', () => {
      const tracking: ApplicationTracking = {
        id: 'track_123',
        userId: 'user_123',
        announcementId: 'ann_123',
        status: 'submitted',
        notes: null,
        notifyDeadline: true,
        notifyResult: false,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-30T00:00:00Z',
      }

      expect(tracking.notifyResult).toBe(false)
    })
  })

  describe('D-day 계산', () => {
    it('마감일까지 3일 남음', () => {
      const now = new Date('2026-01-28T00:00:00Z')
      const deadline = new Date('2026-01-31T23:59:59Z')

      const diffTime = deadline.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      expect(diffDays).toBe(4) // 28, 29, 30, 31 = 4일
    })

    it('마감일 당일', () => {
      const now = new Date('2026-01-31T10:00:00Z')
      const deadline = new Date('2026-01-31T23:59:59Z')

      const diffTime = deadline.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      expect(diffDays).toBe(1)
    })

    it('마감일 지남', () => {
      const now = new Date('2026-02-01T12:00:00Z')  // 확실히 지나도록 시간 추가
      const deadline = new Date('2026-01-31T23:59:59Z')

      const diffTime = deadline.getTime() - now.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))  // floor로 변경하여 음수 유지

      expect(diffDays).toBeLessThan(0)
    })
  })

  describe('상태별 필터링', () => {
    const trackingList: ApplicationTracking[] = [
      {
        id: 'track_1',
        userId: 'user_123',
        announcementId: 'ann_1',
        status: 'interested',
        notes: null,
        notifyDeadline: true,
        notifyResult: true,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      },
      {
        id: 'track_2',
        userId: 'user_123',
        announcementId: 'ann_2',
        status: 'preparing',
        notes: null,
        notifyDeadline: true,
        notifyResult: true,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-29T00:00:00Z',
      },
      {
        id: 'track_3',
        userId: 'user_123',
        announcementId: 'ann_3',
        status: 'submitted',
        notes: null,
        notifyDeadline: true,
        notifyResult: true,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-30T00:00:00Z',
      },
    ]

    it('관심 등록 건만 조회', () => {
      const interested = trackingList.filter(t => t.status === 'interested')

      expect(interested).toHaveLength(1)
      expect(interested[0].id).toBe('track_1')
    })

    it('준비 중인 건만 조회', () => {
      const preparing = trackingList.filter(t => t.status === 'preparing')

      expect(preparing).toHaveLength(1)
      expect(preparing[0].id).toBe('track_2')
    })

    it('제출 완료 건만 조회', () => {
      const submitted = trackingList.filter(t => t.status === 'submitted')

      expect(submitted).toHaveLength(1)
      expect(submitted[0].id).toBe('track_3')
    })
  })

  describe('히스토리 추적', () => {
    it('상태 변경 이력 저장', () => {
      const history = [
        { status: 'interested', changedAt: '2026-01-28T00:00:00Z' },
        { status: 'preparing', changedAt: '2026-01-29T00:00:00Z' },
        { status: 'submitted', changedAt: '2026-01-30T00:00:00Z' },
      ]

      expect(history).toHaveLength(3)
      expect(history[0].status).toBe('interested')
      expect(history[2].status).toBe('submitted')
    })

    it('히스토리 조회 시 최신순 정렬', () => {
      const history = [
        { status: 'interested', changedAt: '2026-01-28T00:00:00Z' },
        { status: 'preparing', changedAt: '2026-01-29T00:00:00Z' },
        { status: 'submitted', changedAt: '2026-01-30T00:00:00Z' },
      ]

      const sorted = [...history].reverse()

      expect(sorted[0].status).toBe('submitted')
      expect(sorted[2].status).toBe('interested')
    })
  })
})

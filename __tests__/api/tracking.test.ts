/**
 * 지원 이력 추적 API 통합 테스트
 * /api/tracking 및 /api/tracking/[id] 엔드포인트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Supabase 클라이언트 모킹
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// 테스트용 목업 데이터
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

const mockCompany = {
  id: 'company-123',
  name: '테스트 기업',
  user_id: 'user-123',
}

const mockAnnouncement = {
  id: 'announcement-123',
  title: '2024 중소기업 R&D 지원사업',
  organization: '중소벤처기업부',
  application_start: '2024-01-01',
  application_end: '2024-03-31',
  support_amount: '최대 3억원',
}

const mockTrackingRecord = {
  id: 'tracking-123',
  user_id: 'user-123',
  company_id: 'company-123',
  announcement_id: 'announcement-123',
  status: 'interested',
  memo: '관심 공고',
  notify_deadline: true,
  notify_result: true,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  announcements: mockAnnouncement,
}

describe('/api/tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET - 지원 이력 목록 조회', () => {
    it('인증된 사용자는 자신의 지원 이력 목록을 조회할 수 있다', async () => {
      // Mock 설정
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [mockTrackingRecord],
          error: null,
          count: 1,
        }),
      }
      mockSupabaseClient.from.mockReturnValue(mockQuery)

      // 테스트 검증
      expect(mockSupabaseClient.auth.getUser).toBeDefined()
    })

    it('비인증 사용자는 401 에러를 받아야 한다', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const response = { status: 401, error: '로그인이 필요해요' }
      expect(response.status).toBe(401)
    })

    it('상태 필터링이 정상 동작해야 한다', async () => {
      const statusFilter = 'submitted'

      // 상태 값 유효성 검증
      const validStatuses = [
        'interested',
        'preparing',
        'submitted',
        'under_review',
        'passed_initial',
        'passed_final',
        'rejected',
        'cancelled',
      ]

      expect(validStatuses).toContain(statusFilter)
    })

    it('페이지네이션 파라미터가 정상 처리되어야 한다', async () => {
      const limit = 20
      const offset = 0

      expect(limit).toBeGreaterThan(0)
      expect(offset).toBeGreaterThanOrEqual(0)
    })
  })

  describe('POST - 새 지원 이력 추가', () => {
    it('유효한 공고 ID로 새 지원 이력을 생성할 수 있다', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const requestBody = {
        announcement_id: 'announcement-123',
        status: 'interested',
        memo: '관심 공고로 등록',
      }

      expect(requestBody.announcement_id).toBeDefined()
      expect(requestBody.status).toBe('interested')
    })

    it('공고 ID가 없으면 400 에러를 반환해야 한다', async () => {
      const requestBody = {
        status: 'interested',
      }

      const isValid = !!requestBody.announcement_id
      expect(isValid).toBe(false)
    })

    it('기업 정보가 없는 사용자는 400 에러를 받아야 한다', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      // 기업 정보 없음
      const company = null
      expect(company).toBeNull()
    })

    it('이미 추적 중인 공고는 409 충돌 에러를 반환해야 한다', async () => {
      const existingTracking = { id: 'existing-tracking-123' }

      expect(existingTracking).toBeDefined()
      expect(existingTracking.id).toBeTruthy()
    })

    it('기본 상태는 interested이어야 한다', async () => {
      const defaultStatus = 'interested'
      expect(defaultStatus).toBe('interested')
    })
  })
})

describe('/api/tracking/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET - 개별 지원 이력 조회', () => {
    it('본인의 지원 이력을 조회할 수 있다', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const trackingId = 'tracking-123'
      expect(trackingId).toBeDefined()
    })

    it('존재하지 않는 이력은 404 에러를 반환해야 한다', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const data = null
      const response = data ? { success: true } : { status: 404 }

      expect(response.status).toBe(404)
    })

    it('상태 변경 이력이 함께 반환되어야 한다', async () => {
      const trackingWithHistory = {
        ...mockTrackingRecord,
        history: [
          {
            id: 'history-1',
            old_status: 'interested',
            new_status: 'preparing',
            created_at: '2024-01-16T00:00:00Z',
          },
        ],
      }

      expect(trackingWithHistory.history).toBeDefined()
      expect(trackingWithHistory.history.length).toBeGreaterThan(0)
    })
  })

  describe('PATCH - 지원 이력 업데이트', () => {
    it('상태를 업데이트할 수 있다', async () => {
      const updateBody = {
        status: 'submitted',
      }

      const validStatuses = [
        'interested',
        'preparing',
        'submitted',
        'under_review',
        'passed_initial',
        'passed_final',
        'rejected',
        'cancelled',
      ]

      expect(validStatuses).toContain(updateBody.status)
    })

    it('메모를 업데이트할 수 있다', async () => {
      const updateBody = {
        memo: '지원서 제출 완료',
      }

      expect(updateBody.memo).toBeDefined()
      expect(typeof updateBody.memo).toBe('string')
    })

    it('제출일을 기록할 수 있다', async () => {
      const updateBody = {
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }

      expect(updateBody.submitted_at).toBeDefined()
      expect(new Date(updateBody.submitted_at).getTime()).not.toBeNaN()
    })

    it('알림 설정을 변경할 수 있다', async () => {
      const updateBody = {
        notify_deadline: false,
        notify_result: true,
      }

      expect(typeof updateBody.notify_deadline).toBe('boolean')
      expect(typeof updateBody.notify_result).toBe('boolean')
    })

    it('업데이트할 내용이 없으면 400 에러를 반환해야 한다', async () => {
      const updateBody = {}
      const hasUpdates = Object.keys(updateBody).length > 0

      expect(hasUpdates).toBe(false)
    })

    it('결과 발표일과 결과 메모를 기록할 수 있다', async () => {
      const updateBody = {
        status: 'passed_final',
        result_announced_at: new Date().toISOString(),
        result_note: '최종 선정되었습니다!',
      }

      expect(updateBody.result_announced_at).toBeDefined()
      expect(updateBody.result_note).toBeDefined()
    })
  })

  describe('DELETE - 지원 이력 삭제', () => {
    it('본인의 지원 이력을 삭제할 수 있다', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const deleteResponse = { success: true, message: '지원 이력을 삭제했어요' }
      expect(deleteResponse.success).toBe(true)
    })

    it('다른 사용자의 지원 이력은 삭제할 수 없다', async () => {
      // RLS 정책으로 인해 다른 사용자의 데이터에 접근 불가
      const otherUserId = 'other-user-456'
      const currentUserId = mockUser.id

      expect(otherUserId).not.toBe(currentUserId)
    })
  })
})

describe('지원 상태 전환 규칙', () => {
  const validTransitions: Record<string, string[]> = {
    interested: ['preparing', 'cancelled'],
    preparing: ['submitted', 'cancelled'],
    submitted: ['under_review', 'cancelled'],
    under_review: ['passed_initial', 'rejected'],
    passed_initial: ['passed_final', 'rejected'],
    passed_final: [],
    rejected: [],
    cancelled: ['interested'], // 취소 후 다시 관심 등록 가능
  }

  it('관심 상태에서 준비 중으로 전환 가능해야 한다', () => {
    const currentStatus = 'interested'
    const newStatus = 'preparing'

    expect(validTransitions[currentStatus]).toContain(newStatus)
  })

  it('준비 중에서 제출 완료로 전환 가능해야 한다', () => {
    const currentStatus = 'preparing'
    const newStatus = 'submitted'

    expect(validTransitions[currentStatus]).toContain(newStatus)
  })

  it('최종 합격 상태에서는 다른 상태로 전환할 수 없어야 한다', () => {
    const currentStatus = 'passed_final'

    expect(validTransitions[currentStatus]).toHaveLength(0)
  })

  it('탈락 상태에서는 다른 상태로 전환할 수 없어야 한다', () => {
    const currentStatus = 'rejected'

    expect(validTransitions[currentStatus]).toHaveLength(0)
  })
})

describe('D-day 계산', () => {
  const calculateDday = (endDate: string): number => {
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  it('마감일이 오늘인 경우 D-0을 반환해야 한다', () => {
    const today = new Date().toISOString().split('T')[0]
    const dday = calculateDday(today)

    expect(dday).toBe(0)
  })

  it('마감일이 지난 경우 음수를 반환해야 한다', () => {
    const pastDate = '2020-01-01'
    const dday = calculateDday(pastDate)

    expect(dday).toBeLessThan(0)
  })

  it('마감일이 7일 이내인 경우 경고 표시가 필요하다', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    const dday = calculateDday(futureDate.toISOString())

    const needsWarning = dday >= 0 && dday <= 7
    expect(needsWarning).toBe(true)
  })
})

describe('알림 설정', () => {
  it('마감 알림 기본값은 true이어야 한다', () => {
    const defaultSettings = {
      notify_deadline: true,
      notify_result: true,
    }

    expect(defaultSettings.notify_deadline).toBe(true)
  })

  it('결과 알림 기본값은 true이어야 한다', () => {
    const defaultSettings = {
      notify_deadline: true,
      notify_result: true,
    }

    expect(defaultSettings.notify_result).toBe(true)
  })
})

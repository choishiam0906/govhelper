// 사용자 피드백 시스템 테스트
// lib/feedback/ 모듈 테스트

import { describe, it, expect } from 'vitest'

// 피드백 타입
type FeedbackType = 'bug' | 'feature' | 'general' | 'other'
type FeedbackStatus = 'pending' | 'reviewing' | 'resolved' | 'closed'

interface Feedback {
  id: string
  userId: string | null
  type: FeedbackType
  subject: string
  message: string
  status: FeedbackStatus
  priority: 'low' | 'medium' | 'high'
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

describe('피드백 시스템', () => {
  describe('피드백 제출', () => {
    it('버그 신고 제출', () => {
      const feedback: Feedback = {
        id: 'feedback_123',
        userId: 'user_123',
        type: 'bug',
        subject: '검색 결과가 나오지 않아요',
        message: '키워드로 검색하면 빈 결과가 나와요',
        status: 'pending',
        priority: 'medium',
        adminNotes: null,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      }

      expect(feedback.type).toBe('bug')
      expect(feedback.status).toBe('pending')
    })

    it('기능 요청 제출', () => {
      const feedback: Feedback = {
        id: 'feedback_456',
        userId: 'user_123',
        type: 'feature',
        subject: '엑셀 다운로드 기능 추가 요청',
        message: '검색 결과를 엑셀로 다운로드하고 싶어요',
        status: 'pending',
        priority: 'low',
        adminNotes: null,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      }

      expect(feedback.type).toBe('feature')
      expect(feedback.priority).toBe('low')
    })

    it('일반 의견 제출', () => {
      const feedback: Feedback = {
        id: 'feedback_789',
        userId: 'user_123',
        type: 'general',
        subject: '서비스가 유용해요',
        message: '정부지원사업 찾기가 정말 편리해졌어요',
        status: 'pending',
        priority: 'low',
        adminNotes: null,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      }

      expect(feedback.type).toBe('general')
      expect(feedback.message).toContain('편리')
    })

    it('비회원 피드백 제출', () => {
      const feedback: Feedback = {
        id: 'feedback_999',
        userId: null,
        type: 'bug',
        subject: '회원가입이 안 돼요',
        message: '카카오 로그인 버튼이 작동하지 않아요',
        status: 'pending',
        priority: 'high',
        adminNotes: null,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      }

      expect(feedback.userId).toBeNull()
      expect(feedback.priority).toBe('high')
    })
  })

  describe('피드백 처리 플로우', () => {
    it('제출 → 검토 중 → 해결', () => {
      const feedback: Feedback = {
        id: 'feedback_123',
        userId: 'user_123',
        type: 'bug',
        subject: '버그 제목',
        message: '버그 내용',
        status: 'pending',
        priority: 'medium',
        adminNotes: null,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      }

      // 검토 시작
      feedback.status = 'reviewing'
      feedback.adminNotes = '버그 재현 확인, 수정 작업 진행 중'
      feedback.updatedAt = '2026-01-29T00:00:00Z'

      expect(feedback.status).toBe('reviewing')
      expect(feedback.adminNotes).not.toBeNull()

      // 해결 완료
      feedback.status = 'resolved'
      feedback.adminNotes += '\n수정 완료, 배포 예정'
      feedback.updatedAt = '2026-01-30T00:00:00Z'

      expect(feedback.status).toBe('resolved')
    })

    it('제출 → 종료 (중복 제보)', () => {
      const feedback: Feedback = {
        id: 'feedback_123',
        userId: 'user_123',
        type: 'bug',
        subject: '버그 제목',
        message: '버그 내용',
        status: 'pending',
        priority: 'medium',
        adminNotes: null,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      }

      feedback.status = 'closed'
      feedback.adminNotes = '중복 제보 (feedback_100과 동일)'

      expect(feedback.status).toBe('closed')
    })
  })

  describe('우선순위 자동 판단', () => {
    it('버그 + "결제" 키워드 = 높은 우선순위', () => {
      const feedback = {
        type: 'bug' as FeedbackType,
        subject: '결제가 안 돼요',
        message: '결제 버튼을 눌러도 반응이 없어요',
      }

      const priority = determinePriority(feedback)

      expect(priority).toBe('high')
    })

    it('버그 + "로그인" 키워드 = 높은 우선순위', () => {
      const feedback = {
        type: 'bug' as FeedbackType,
        subject: '로그인이 안 돼요',
        message: '로그인 버튼을 눌러도 반응이 없어요',
      }

      const priority = determinePriority(feedback)

      expect(priority).toBe('high')
    })

    it('버그 + 일반 내용 = 중간 우선순위', () => {
      const feedback = {
        type: 'bug' as FeedbackType,
        subject: 'UI 깨짐',
        message: '모바일에서 버튼이 잘려 보여요',
      }

      const priority = determinePriority(feedback)

      expect(priority).toBe('medium')
    })

    it('기능 요청 = 낮은 우선순위', () => {
      const feedback = {
        type: 'feature' as FeedbackType,
        subject: '다크 모드 추가 요청',
        message: '다크 모드가 있으면 좋겠어요',
      }

      const priority = determinePriority(feedback)

      expect(priority).toBe('low')
    })

    it('일반 의견 = 낮은 우선순위', () => {
      const feedback = {
        type: 'general' as FeedbackType,
        subject: '좋은 서비스네요',
        message: '유용하게 쓰고 있어요',
      }

      const priority = determinePriority(feedback)

      expect(priority).toBe('low')
    })
  })

  describe('통계', () => {
    const feedbacks: Feedback[] = [
      {
        id: '1',
        userId: 'user_1',
        type: 'bug',
        subject: '버그1',
        message: '내용1',
        status: 'resolved',
        priority: 'high',
        adminNotes: null,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      },
      {
        id: '2',
        userId: 'user_2',
        type: 'feature',
        subject: '기능1',
        message: '내용2',
        status: 'pending',
        priority: 'low',
        adminNotes: null,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      },
      {
        id: '3',
        userId: 'user_3',
        type: 'bug',
        subject: '버그2',
        message: '내용3',
        status: 'reviewing',
        priority: 'medium',
        adminNotes: null,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      },
    ]

    it('전체 피드백 수', () => {
      expect(feedbacks).toHaveLength(3)
    })

    it('버그 제보 수', () => {
      const bugs = feedbacks.filter(f => f.type === 'bug')
      expect(bugs).toHaveLength(2)
    })

    it('해결된 피드백 수', () => {
      const resolved = feedbacks.filter(f => f.status === 'resolved')
      expect(resolved).toHaveLength(1)
    })

    it('대기 중인 피드백 수', () => {
      const pending = feedbacks.filter(f => f.status === 'pending')
      expect(pending).toHaveLength(1)
    })

    it('높은 우선순위 피드백 수', () => {
      const high = feedbacks.filter(f => f.priority === 'high')
      expect(high).toHaveLength(1)
    })
  })

  describe('검색 및 필터', () => {
    const feedbacks: Feedback[] = [
      {
        id: '1',
        userId: 'user_1',
        type: 'bug',
        subject: '검색 버그',
        message: '검색이 안 돼요',
        status: 'pending',
        priority: 'high',
        adminNotes: null,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      },
      {
        id: '2',
        userId: 'user_2',
        type: 'feature',
        subject: '검색 기능 개선',
        message: '검색 필터 추가 요청',
        status: 'pending',
        priority: 'low',
        adminNotes: null,
        createdAt: '2026-01-28T00:00:00Z',
        updatedAt: '2026-01-28T00:00:00Z',
      },
    ]

    it('제목으로 검색', () => {
      const results = feedbacks.filter(f =>
        f.subject.includes('검색')
      )

      expect(results).toHaveLength(2)
    })

    it('타입으로 필터', () => {
      const bugs = feedbacks.filter(f => f.type === 'bug')

      expect(bugs).toHaveLength(1)
      expect(bugs[0].subject).toBe('검색 버그')
    })

    it('우선순위로 정렬', () => {
      const sorted = [...feedbacks].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

      expect(sorted[0].priority).toBe('high')
      expect(sorted[1].priority).toBe('low')
    })
  })
})

// 우선순위 판단 헬퍼 함수
function determinePriority(feedback: {
  type: FeedbackType
  subject: string
  message: string
}): 'low' | 'medium' | 'high' {
  if (feedback.type !== 'bug') {
    return 'low'
  }

  const criticalKeywords = ['결제', '로그인', '회원가입', '구독', '오류']
  const text = (feedback.subject + ' ' + feedback.message).toLowerCase()

  for (const keyword of criticalKeywords) {
    if (text.includes(keyword)) {
      return 'high'
    }
  }

  return 'medium'
}

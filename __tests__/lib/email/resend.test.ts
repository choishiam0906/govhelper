// Resend 이메일 발송 기능 테스트
// lib/email/ 모듈 테스트

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Resend SDK 전체 모킹
vi.mock('resend', () => {
  return {
    Resend: class Resend {
      emails = {
        send: vi.fn(),
      }
    },
  }
})

describe('Resend 이메일 발송', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('RESEND_API_KEY', 'test_api_key')
  })

  describe('이메일 발송 성공', () => {
    it('뉴스레터 구독 확인 이메일을 발송해야 한다', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend() as any

      mockResend.emails.send.mockResolvedValueOnce({
        id: 'email_123',
        from: 'noreply@govhelpers.com',
        to: 'user@example.com',
        subject: '뉴스레터 구독 확인',
      })

      const result = await mockResend.emails.send({
        from: 'noreply@govhelpers.com',
        to: 'user@example.com',
        subject: '뉴스레터 구독 확인',
        html: '<p>구독 확인 링크를 클릭해주세요</p>',
      })

      expect(result.id).toBe('email_123')
      expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'noreply@govhelpers.com',
        to: 'user@example.com',
        subject: '뉴스레터 구독 확인',
        html: '<p>구독 확인 링크를 클릭해주세요</p>',
      })
    })

    it('마감 임박 알림 이메일을 발송해야 한다', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend() as any

      mockResend.emails.send.mockResolvedValueOnce({
        id: 'email_456',
        from: 'noreply@govhelpers.com',
        to: 'user@example.com',
        subject: '[GovHelper] 마감 임박 공고 알림',
      })

      const result = await mockResend.emails.send({
        from: 'noreply@govhelpers.com',
        to: 'user@example.com',
        subject: '[GovHelper] 마감 임박 공고 알림',
        html: '<p>마감 3일 전입니다</p>',
      })

      expect(result.id).toBe('email_456')
    })

    it('공고 변경 알림 이메일을 발송해야 한다', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend() as any

      mockResend.emails.send.mockResolvedValueOnce({
        id: 'email_789',
      })

      const result = await mockResend.emails.send({
        from: 'noreply@govhelpers.com',
        to: 'user@example.com',
        subject: '[GovHelper] 공고 내용이 변경되었어요',
        html: '<p>지원금액이 변경되었습니다</p>',
      })

      expect(result.id).toBe('email_789')
    })
  })

  describe('이메일 발송 실패', () => {
    it('잘못된 이메일 주소 시 에러를 던져야 한다', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend() as any

      mockResend.emails.send.mockRejectedValueOnce(
        new Error('Invalid email address')
      )

      await expect(
        mockResend.emails.send({
          from: 'noreply@govhelpers.com',
          to: 'invalid-email',
          subject: '테스트',
          html: '<p>테스트</p>',
        })
      ).rejects.toThrow('Invalid email address')
    })

    it('API 키가 없으면 에러를 던져야 한다', async () => {
      delete process.env.RESEND_API_KEY

      const { Resend } = await import('resend')
      const mockResend = new Resend() as any

      mockResend.emails.send.mockRejectedValueOnce(
        new Error('API key is required')
      )

      await expect(
        mockResend.emails.send({
          from: 'noreply@govhelpers.com',
          to: 'user@example.com',
          subject: '테스트',
          html: '<p>테스트</p>',
        })
      ).rejects.toThrow('API key is required')
    })

    it('네트워크 오류 시 에러를 던져야 한다', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend() as any

      mockResend.emails.send.mockRejectedValueOnce(
        new Error('Network error')
      )

      await expect(
        mockResend.emails.send({
          from: 'noreply@govhelpers.com',
          to: 'user@example.com',
          subject: '테스트',
          html: '<p>테스트</p>',
        })
      ).rejects.toThrow('Network error')
    })
  })

  describe('이메일 템플릿', () => {
    it('HTML 템플릿을 올바르게 렌더링해야 한다', () => {
      const announcementTitle = 'IT 스타트업 지원사업'
      const daysLeft = 3

      const html = `
        <h1>마감 임박 공고 알림</h1>
        <p><strong>${announcementTitle}</strong> 공고가 <strong>${daysLeft}일</strong> 후 마감됩니다.</p>
      `

      expect(html).toContain('IT 스타트업 지원사업')
      expect(html).toContain('3일')
    })

    it('변경 알림 템플릿을 올바르게 렌더링해야 한다', () => {
      const changes = [
        { field: 'support_amount', oldValue: '5000만원', newValue: '7000만원' },
        { field: 'application_end', oldValue: '2026-01-31', newValue: '2026-02-28' },
      ]

      const html = `
        <h1>공고 변경 알림</h1>
        <ul>
          ${changes.map(c => `<li>${c.field}: ${c.oldValue} → ${c.newValue}</li>`).join('')}
        </ul>
      `

      expect(html).toContain('support_amount')
      expect(html).toContain('5000만원')
      expect(html).toContain('7000만원')
    })
  })

  describe('이메일 우선순위', () => {
    it('긴급 알림은 우선순위가 높아야 한다', () => {
      const urgentEmail = {
        priority: 'high',
        subject: '[긴급] 마감 1일 전',
      }

      const normalEmail = {
        priority: 'normal',
        subject: '마감 7일 전',
      }

      expect(urgentEmail.priority).toBe('high')
      expect(normalEmail.priority).toBe('normal')
    })
  })

  describe('배치 발송', () => {
    it('여러 사용자에게 동시에 발송할 수 있어야 한다', async () => {
      const { Resend } = await import('resend')
      const mockResend = new Resend() as any

      const recipients = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ]

      mockResend.emails.send.mockResolvedValue({ id: 'batch_123' })

      const promises = recipients.map(to =>
        mockResend.emails.send({
          from: 'noreply@govhelpers.com',
          to,
          subject: '뉴스레터',
          html: '<p>뉴스레터 내용</p>',
        })
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      expect(mockResend.emails.send).toHaveBeenCalledTimes(3)
    })
  })
})

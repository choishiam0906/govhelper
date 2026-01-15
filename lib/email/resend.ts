import { Resend } from 'resend'

// Resend 클라이언트 생성 (API 키가 없으면 null)
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// 발송자 이메일 (Resend 인증된 도메인 필요)
// 도메인 인증 전에는 onboarding@resend.dev 사용 가능
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'GovHelper <onboarding@resend.dev>'

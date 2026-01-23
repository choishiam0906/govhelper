// 관리자 이메일 목록 (환경변수에서 읽거나 기본값 사용)
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'choishiam@gmail.com')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean)

// 관리자 권한 확인
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}

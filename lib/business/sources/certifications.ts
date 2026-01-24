// 기업 인증 정보 조회 (벤처인증, 이노비즈, 메인비즈 등)

import { SupabaseClient } from '@supabase/supabase-js'

export type CertificationType =
  | 'venture'        // 벤처인증
  | 'innobiz'        // 이노비즈
  | 'mainbiz'        // 메인비즈
  | 'greencompany'   // 녹색기업
  | 'familyfriendly' // 가족친화기업
  | 'socialenterprise' // 사회적기업
  | 'womenbiz'       // 여성기업

export interface CertificationResult {
  source: 'certifications'
  businessNumber: string
  certifications: Array<{
    type: CertificationType
    name: string              // 인증명
    certNumber: string | null // 인증번호
    issuedDate: string | null // 발급일
    expiryDate: string | null // 만료일
    isValid: boolean          // 현재 유효 여부
    issuingOrg: string        // 발급기관
  }>
}

/**
 * Supabase에서 인증 정보 조회
 *
 * @param supabase - Supabase 클라이언트
 * @param businessNumber - 사업자등록번호 (하이픈 포함/미포함 모두 가능)
 * @returns 인증 정보 결과
 *
 * @example
 * const result = await lookupCertifications(supabase, '123-45-67890')
 * if (result) {
 *   console.log(result.certifications.length) // 보유 인증 개수
 * }
 */
export async function lookupCertifications(
  supabase: SupabaseClient,
  businessNumber: string
): Promise<CertificationResult | null> {
  try {
    // 하이픈 제거
    const cleaned = businessNumber.replace(/-/g, '')

    const { data, error } = await supabase
      .from('company_certifications')
      .select('*')
      .eq('business_number', cleaned)

    if (error) {
      console.error('[Certifications] Lookup error:', error)
      return null
    }

    if (!data || data.length === 0) {
      return {
        source: 'certifications',
        businessNumber: cleaned,
        certifications: [],
      }
    }

    return {
      source: 'certifications',
      businessNumber: cleaned,
      certifications: data.map((cert: any) => ({
        type: cert.cert_type as CertificationType,
        name: cert.cert_name,
        certNumber: cert.cert_number || null,
        issuedDate: cert.issued_date || null,
        expiryDate: cert.expiry_date || null,
        isValid: cert.is_valid ?? true,
        issuingOrg: cert.issuing_org || '알 수 없음',
      })),
    }
  } catch (error) {
    console.error('[Certifications] Unexpected error:', error)
    return null
  }
}

/**
 * 특정 인증 보유 여부 확인
 *
 * @param supabase - Supabase 클라이언트
 * @param businessNumber - 사업자등록번호
 * @param certType - 확인할 인증 타입
 * @returns 인증 보유 여부
 *
 * @example
 * const hasVenture = await hasCertification(supabase, '123-45-67890', 'venture')
 * if (hasVenture) {
 *   console.log('벤처인증 보유 기업')
 * }
 */
export async function hasCertification(
  supabase: SupabaseClient,
  businessNumber: string,
  certType: CertificationType
): Promise<boolean> {
  const result = await lookupCertifications(supabase, businessNumber)

  if (!result) return false

  return result.certifications.some(
    (cert) => cert.type === certType && cert.isValid
  )
}

/**
 * 인증명으로 타입 추론
 *
 * @param certName - 인증명 (예: "벤처기업확인서", "이노비즈 인증")
 * @returns 추론된 인증 타입
 *
 * @example
 * const type = inferCertificationType('벤처기업확인서')
 * console.log(type) // 'venture'
 */
export function inferCertificationType(certName: string): CertificationType | null {
  const name = certName.toLowerCase().replace(/\s+/g, '')

  if (name.includes('벤처') || name.includes('venture')) {
    return 'venture'
  }
  if (name.includes('이노비즈') || name.includes('innobiz')) {
    return 'innobiz'
  }
  if (name.includes('메인비즈') || name.includes('mainbiz')) {
    return 'mainbiz'
  }
  if (name.includes('녹색기업') || name.includes('green')) {
    return 'greencompany'
  }
  if (name.includes('가족친화') || name.includes('familyfriendly')) {
    return 'familyfriendly'
  }
  if (name.includes('사회적기업') || name.includes('socialenterprise')) {
    return 'socialenterprise'
  }
  if (name.includes('여성기업') || name.includes('womenbiz')) {
    return 'womenbiz'
  }

  return null
}

/**
 * 인증 타입 한글명 반환
 */
export function getCertificationName(certType: CertificationType): string {
  const names: Record<CertificationType, string> = {
    venture: '벤처인증',
    innobiz: '이노비즈',
    mainbiz: '메인비즈',
    greencompany: '녹색기업',
    familyfriendly: '가족친화기업',
    socialenterprise: '사회적기업',
    womenbiz: '여성기업',
  }
  return names[certType]
}

/**
 * 공고 품질 점수 시스템
 * 공고 필드 완성도 기반 0-100점 품질 점수 계산
 */

export interface QualityScoreBreakdown {
  totalScore: number // 0-100
  breakdown: {
    basicInfo: number // 제목, 기관명, 소스 (20점)
    description: number // 설명 길이 및 품질 (20점)
    eligibility: number // 지원자격 파싱 완료 (20점)
    dates: number // 접수기간 정보 (15점)
    supportAmount: number // 지원금액 정보 (15점)
    attachments: number // 첨부파일 정보 (10점)
  }
  missingFields: string[] // 누락된 필드 목록
}

interface AnnouncementData {
  id: string
  title: string | null
  organization: string | null
  source: string | null
  status: string | null
  content: string | null
  parsed_content: string | null
  eligibility_criteria: {
    confidence?: number
  } | null
  application_start: string | null
  application_end: string | null
  support_amount: string | null
  attachment_urls: string[] | null
}

/**
 * 공고 품질 점수 계산
 */
export function calculateQualityScore(
  announcement: AnnouncementData
): QualityScoreBreakdown {
  const breakdown = {
    basicInfo: 0,
    description: 0,
    eligibility: 0,
    dates: 0,
    supportAmount: 0,
    attachments: 0,
  }
  const missingFields: string[] = []

  // 1. 기본 정보 (20점)
  // title 존재 (5점)
  if (announcement.title && announcement.title.trim()) {
    breakdown.basicInfo += 5
  } else {
    missingFields.push('제목')
  }

  // organization 존재 (5점)
  if (announcement.organization && announcement.organization.trim()) {
    breakdown.basicInfo += 5
  } else {
    missingFields.push('기관명')
  }

  // source 존재 (5점)
  if (announcement.source && announcement.source.trim()) {
    breakdown.basicInfo += 5
  } else {
    missingFields.push('소스')
  }

  // status 존재 (5점)
  if (announcement.status && announcement.status.trim()) {
    breakdown.basicInfo += 5
  } else {
    missingFields.push('상태')
  }

  // 2. 설명 품질 (20점)
  const description = announcement.parsed_content || announcement.content || ''
  const descriptionLength = description.trim().length

  if (descriptionLength === 0) {
    missingFields.push('설명')
  } else if (descriptionLength < 100) {
    breakdown.description = 5
  } else if (descriptionLength < 500) {
    breakdown.description = 10
  } else {
    breakdown.description = 20
  }

  // 3. 지원자격 파싱 (20점)
  if (!announcement.eligibility_criteria) {
    missingFields.push('지원자격')
  } else {
    const confidence = announcement.eligibility_criteria.confidence || 0
    if (confidence < 0.7) {
      breakdown.eligibility = 10
    } else {
      breakdown.eligibility = 20
    }
  }

  // 4. 접수기간 정보 (15점)
  if (announcement.application_start && announcement.application_start.trim()) {
    breakdown.dates += 7
  } else {
    missingFields.push('접수 시작일')
  }

  if (announcement.application_end && announcement.application_end.trim()) {
    breakdown.dates += 8
  } else {
    missingFields.push('접수 마감일')
  }

  // 5. 지원금액 정보 (15점)
  if (announcement.support_amount && announcement.support_amount.trim()) {
    breakdown.supportAmount = 15
  } else {
    missingFields.push('지원금액')
  }

  // 6. 첨부파일 정보 (10점)
  if (
    announcement.attachment_urls &&
    Array.isArray(announcement.attachment_urls) &&
    announcement.attachment_urls.length > 0
  ) {
    breakdown.attachments = 10
  } else {
    missingFields.push('첨부파일')
  }

  // 총점 계산
  const totalScore =
    breakdown.basicInfo +
    breakdown.description +
    breakdown.eligibility +
    breakdown.dates +
    breakdown.supportAmount +
    breakdown.attachments

  return {
    totalScore,
    breakdown,
    missingFields,
  }
}

/**
 * 품질 등급 반환
 */
export function getQualityGrade(score: number): {
  grade: string
  label: string
  color: string
} {
  if (score >= 90) {
    return { grade: 'A', label: '우수', color: 'green' }
  } else if (score >= 75) {
    return { grade: 'B', label: '양호', color: 'blue' }
  } else if (score >= 60) {
    return { grade: 'C', label: '보통', color: 'yellow' }
  } else {
    return { grade: 'D', label: '미흡', color: 'red' }
  }
}

/**
 * 품질 점수 통계 계산
 */
export function calculateQualityStats(scores: number[]): {
  average: number
  median: number
  min: number
  max: number
  distribution: {
    A: number // 90+
    B: number // 75-89
    C: number // 60-74
    D: number // 0-59
  }
} {
  if (scores.length === 0) {
    return {
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      distribution: { A: 0, B: 0, C: 0, D: 0 },
    }
  }

  const sorted = [...scores].sort((a, b) => a - b)
  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length
  const median =
    scores.length % 2 === 0
      ? (sorted[scores.length / 2 - 1] + sorted[scores.length / 2]) / 2
      : sorted[Math.floor(scores.length / 2)]

  const distribution = {
    A: scores.filter((s) => s >= 90).length,
    B: scores.filter((s) => s >= 75 && s < 90).length,
    C: scores.filter((s) => s >= 60 && s < 75).length,
    D: scores.filter((s) => s < 60).length,
  }

  return {
    average: Math.round(average * 10) / 10,
    median: Math.round(median * 10) / 10,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    distribution,
  }
}

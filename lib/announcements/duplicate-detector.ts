import { SupabaseClient } from '@supabase/supabase-js'

export interface DuplicateResult {
  isDuplicate: boolean
  originalId?: string       // 원본 공고 ID
  similarity: number        // 유사도 (0-1)
  matchType: 'exact_title' | 'similar_title' | 'none'
}

/**
 * 제목 정규화
 * - 공백 정규화 (연속 공백 → 단일 공백)
 * - 괄호 안 연도/차수 제거: "[2026년]", "(제3차)", "[3차]"
 * - 특수문자 제거: ※, ★, ●, ■, □, ▶
 * - 앞뒤 공백 trim
 */
function normalizeTitle(title: string): string {
  return title
    // 괄호 안 연도/차수 제거
    .replace(/\[?\d{4}년\]?/g, '')            // [2026년], 2026년
    .replace(/[\(\[]\s*제?\s*\d+\s*차\s*[\)\]]/g, '') // (제3차), [3차]
    // 특수문자 제거
    .replace(/[※★●■□▶]/g, '')
    // 연속 공백 → 단일 공백
    .replace(/\s+/g, ' ')
    // 앞뒤 공백 trim
    .trim()
}

/**
 * Levenshtein 거리 기반 유사도 계산
 * @returns 0-1 사이의 유사도 (1에 가까울수록 유사)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1

  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0) return 0
  if (len2 === 0) return 0

  // Levenshtein 거리 계산
  const matrix: number[][] = []

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  const distance = matrix[len1][len2]
  const maxLength = Math.max(len1, len2)

  // 유사도 = 1 - (거리 / 최대 길이)
  return 1 - (distance / maxLength)
}

/**
 * 제목 기반 중복 감지
 * 1. 정확한 제목 일치 (정규화 후)
 * 2. 유사도 90% 이상 (레벤슈타인 거리)
 *
 * @param title - 검사할 제목
 * @param organization - 기관명
 * @param source - 소스 (자신의 소스는 제외)
 * @param supabase - Supabase 클라이언트
 */
export async function detectDuplicate(
  title: string,
  organization: string,
  source: string,
  supabase: SupabaseClient
): Promise<DuplicateResult> {

  const normalizedTitle = normalizeTitle(title)

  // 1. 정확한 제목 매칭 (같은 소스 제외, 같은 기관)
  // 정규화된 제목을 직접 비교하기 위해 모든 활성 공고 조회
  const { data: activeAnnouncements, error } = await supabase
    .from('announcements')
    .select('id, title, organization, source')
    .eq('status', 'active')
    .eq('organization', organization)
    .neq('source', source)

  if (error) {
    console.error('중복 감지 쿼리 오류:', error)
    return { isDuplicate: false, similarity: 0, matchType: 'none' }
  }

  if (!activeAnnouncements || activeAnnouncements.length === 0) {
    return { isDuplicate: false, similarity: 0, matchType: 'none' }
  }

  // 정규화된 제목으로 정확 매칭
  for (const ann of activeAnnouncements) {
    const annNormalized = normalizeTitle(ann.title)

    if (annNormalized === normalizedTitle) {
      console.log(`[중복 감지] 정확 매칭: "${title}" (원본: ${ann.id})`)
      return {
        isDuplicate: true,
        originalId: ann.id,
        similarity: 1.0,
        matchType: 'exact_title'
      }
    }
  }

  // 2. 유사도 90% 이상 매칭
  for (const ann of activeAnnouncements) {
    const annNormalized = normalizeTitle(ann.title)
    const similarity = calculateSimilarity(normalizedTitle, annNormalized)

    if (similarity >= 0.90) {
      console.log(`[중복 감지] 유사 매칭 (${(similarity * 100).toFixed(1)}%): "${title}" (원본: ${ann.id})`)
      return {
        isDuplicate: true,
        originalId: ann.id,
        similarity,
        matchType: 'similar_title'
      }
    }
  }

  return { isDuplicate: false, similarity: 0, matchType: 'none' }
}

/**
 * 중복 후보 타입
 */
export interface DuplicateCandidate {
  originalId: string
  duplicateId: string
  similarity: number
  matchType: 'exact_title' | 'similar_title'
  originalTitle?: string
  duplicateTitle?: string
}

/**
 * 중복 그룹 타입
 */
export interface DuplicateGroup {
  ids: string[]
  titles: string[]
  count: number
}

/**
 * 공고 목록에서 중복 후보 감지
 * @param announcements - 검사할 공고 목록
 * @param options - 감지 옵션
 */
export function detectDuplicates(
  announcements: Array<{
    id: string
    title: string
    organization: string
    source: string
  }>,
  options: {
    similarityThreshold?: number  // 유사도 임계값 (기본: 90)
    dateDiffDays?: number         // 날짜 차이 임계값 (현재 미사용)
  } = {}
): DuplicateCandidate[] {
  const { similarityThreshold = 90 } = options
  const threshold = similarityThreshold / 100 // 0.9

  const duplicates: DuplicateCandidate[] = []
  const processed = new Set<string>()

  for (let i = 0; i < announcements.length; i++) {
    const ann1 = announcements[i]
    if (processed.has(ann1.id)) continue

    const normalized1 = normalizeTitle(ann1.title)

    for (let j = i + 1; j < announcements.length; j++) {
      const ann2 = announcements[j]
      if (processed.has(ann2.id)) continue

      // 같은 소스는 제외
      if (ann1.source === ann2.source) continue

      // 같은 기관이 아니면 제외
      if (ann1.organization !== ann2.organization) continue

      const normalized2 = normalizeTitle(ann2.title)

      // 정확 매칭
      if (normalized1 === normalized2) {
        duplicates.push({
          originalId: ann1.id,
          duplicateId: ann2.id,
          similarity: 1.0,
          matchType: 'exact_title',
          originalTitle: ann1.title,
          duplicateTitle: ann2.title,
        })
        continue
      }

      // 유사도 매칭
      const similarity = calculateSimilarity(normalized1, normalized2)
      if (similarity >= threshold) {
        duplicates.push({
          originalId: ann1.id,
          duplicateId: ann2.id,
          similarity,
          matchType: 'similar_title',
          originalTitle: ann1.title,
          duplicateTitle: ann2.title,
        })
      }
    }
  }

  return duplicates
}

/**
 * 중복 후보를 그룹으로 묶기
 * @param duplicates - 중복 후보 목록
 */
export function groupDuplicates(duplicates: DuplicateCandidate[]): DuplicateGroup[] {
  const groups: Map<string, Set<string>> = new Map()
  const idToGroup: Map<string, string> = new Map()

  // Union-Find 알고리즘으로 그룹화
  for (const dup of duplicates) {
    const { originalId, duplicateId } = dup

    const group1 = idToGroup.get(originalId)
    const group2 = idToGroup.get(duplicateId)

    if (!group1 && !group2) {
      // 새로운 그룹 생성
      const groupId = originalId
      const members = new Set([originalId, duplicateId])
      groups.set(groupId, members)
      idToGroup.set(originalId, groupId)
      idToGroup.set(duplicateId, groupId)
    } else if (group1 && !group2) {
      // group1에 duplicateId 추가
      groups.get(group1)!.add(duplicateId)
      idToGroup.set(duplicateId, group1)
    } else if (!group1 && group2) {
      // group2에 originalId 추가
      groups.get(group2)!.add(originalId)
      idToGroup.set(originalId, group2)
    } else if (group1 !== group2) {
      // 두 그룹 병합
      const members1 = groups.get(group1!)!
      const members2 = groups.get(group2!)!
      const merged = new Set([...members1, ...members2])
      groups.set(group1!, merged)
      groups.delete(group2!)
      for (const id of members2) {
        idToGroup.set(id, group1!)
      }
    }
  }

  // 그룹을 배열로 변환
  return Array.from(groups.values()).map(ids => ({
    ids: Array.from(ids),
    titles: [],
    count: ids.size,
  }))
}

/**
 * 중복 공고 감지 시스템
 *
 * 제목 유사도 계산 및 중복 후보 탐지
 */

/**
 * 중복 공고 후보
 */
export interface DuplicateCandidate {
  originalId: string
  duplicateId: string
  similarityScore: number // 0-100
  matchReasons: string[] // ['title_similar', 'same_org', 'same_deadline']
}

/**
 * 중복 감지 옵션
 */
export interface DuplicateDetectionOptions {
  similarityThreshold?: number // 기본: 90
  dateDiffDays?: number // 마감일 차이 허용 (기본: 3일)
}

/**
 * Levenshtein Distance 계산
 * 두 문자열 간의 편집 거리 반환
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 삭제
          dp[i][j - 1] + 1,     // 삽입
          dp[i - 1][j - 1] + 1  // 교체
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Jaccard Similarity 계산
 * 두 문자열을 단어 집합으로 변환하여 유사도 계산
 */
function jaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(/\s+/))
  const set2 = new Set(str2.split(/\s+/))

  const arr1 = Array.from(set1)
  const arr2 = Array.from(set2)
  const intersection = new Set(arr1.filter(x => set2.has(x)))
  const union = new Set(arr1.concat(arr2))

  if (union.size === 0) return 0
  return (intersection.size / union.size) * 100
}

/**
 * 문자열 정규화
 * - 특수문자 제거
 * - 연속 공백 제거
 * - 소문자 변환
 */
export function normalizeString(str: string): string {
  return str
    .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거
    .replace(/\s+/g, ' ')          // 연속 공백 제거
    .trim()
    .toLowerCase()
}

/**
 * 제목 유사도 계산
 * Levenshtein Distance와 Jaccard Similarity의 가중 평균
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
  const normalized1 = normalizeString(title1)
  const normalized2 = normalizeString(title2)

  // 동일한 경우 100% 반환
  if (normalized1 === normalized2) return 100

  // Levenshtein Distance 기반 유사도
  const maxLen = Math.max(normalized1.length, normalized2.length)
  const levDistance = levenshteinDistance(normalized1, normalized2)
  const levSimilarity = ((maxLen - levDistance) / maxLen) * 100

  // Jaccard Similarity
  const jaccardSim = jaccardSimilarity(normalized1, normalized2)

  // 가중 평균 (Levenshtein 60%, Jaccard 40%)
  return levSimilarity * 0.6 + jaccardSim * 0.4
}

/**
 * 마감일 유사도 체크
 */
export function isSimilarDeadline(
  date1: string | null,
  date2: string | null,
  diffDays: number = 3
): boolean {
  if (!date1 || !date2) return false

  const d1 = new Date(date1)
  const d2 = new Date(date2)

  const diffMs = Math.abs(d1.getTime() - d2.getTime())
  const diffDaysActual = diffMs / (1000 * 60 * 60 * 24)

  return diffDaysActual <= diffDays
}

/**
 * 중복 후보 탐지
 *
 * @param announcements 공고 목록
 * @param options 감지 옵션
 * @returns 중복 후보 목록
 */
export function detectDuplicates(
  announcements: Array<{
    id: string
    title: string
    organization: string
    application_end: string | null
  }>,
  options: DuplicateDetectionOptions = {}
): DuplicateCandidate[] {
  const {
    similarityThreshold = 90,
    dateDiffDays = 3,
  } = options

  const duplicates: DuplicateCandidate[] = []
  const seen = new Set<string>()

  for (let i = 0; i < announcements.length; i++) {
    for (let j = i + 1; j < announcements.length; j++) {
      const a1 = announcements[i]
      const a2 = announcements[j]

      // 이미 처리한 쌍 건너뛰기
      const pairKey = [a1.id, a2.id].sort().join('-')
      if (seen.has(pairKey)) continue

      const matchReasons: string[] = []
      let totalScore = 0

      // 1. 제목 유사도 (가중치: 50%)
      const titleSimilarity = calculateTitleSimilarity(a1.title, a2.title)
      if (titleSimilarity >= 70) {
        matchReasons.push('title_similar')
        totalScore += titleSimilarity * 0.5
      } else {
        continue // 제목 유사도가 낮으면 중복 아님
      }

      // 2. 동일 기관 (가중치: 30%)
      if (a1.organization === a2.organization) {
        matchReasons.push('same_org')
        totalScore += 30
      }

      // 3. 유사한 마감일 (가중치: 20%)
      if (isSimilarDeadline(a1.application_end, a2.application_end, dateDiffDays)) {
        matchReasons.push('same_deadline')
        totalScore += 20
      }

      // 4. 임계값 이상인 경우만 중복 후보로 추가
      if (totalScore >= similarityThreshold) {
        duplicates.push({
          originalId: a1.id,
          duplicateId: a2.id,
          similarityScore: Math.round(totalScore),
          matchReasons,
        })
        seen.add(pairKey)
      }
    }
  }

  // 점수 높은 순으로 정렬
  return duplicates.sort((a, b) => b.similarityScore - a.similarityScore)
}

/**
 * 중복 그룹 생성
 * 연결된 중복 공고를 그룹으로 묶음
 */
export function groupDuplicates(
  duplicates: DuplicateCandidate[]
): Array<{ ids: string[]; score: number }> {
  const graph = new Map<string, Set<string>>()

  // 그래프 구성
  for (const dup of duplicates) {
    if (!graph.has(dup.originalId)) {
      graph.set(dup.originalId, new Set())
    }
    if (!graph.has(dup.duplicateId)) {
      graph.set(dup.duplicateId, new Set())
    }
    graph.get(dup.originalId)!.add(dup.duplicateId)
    graph.get(dup.duplicateId)!.add(dup.originalId)
  }

  // DFS로 연결 컴포넌트 찾기
  const visited = new Set<string>()
  const groups: Array<{ ids: string[]; score: number }> = []

  function dfs(node: string, group: string[]) {
    visited.add(node)
    group.push(node)

    const neighbors = graph.get(node)
    if (neighbors) {
      const neighborsArray = Array.from(neighbors)
      for (const neighbor of neighborsArray) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, group)
        }
      }
    }
  }

  const graphEntries = Array.from(graph.entries())
  for (const [node] of graphEntries) {
    if (!visited.has(node)) {
      const group: string[] = []
      dfs(node, group)

      if (group.length >= 2) {
        // 그룹 평균 점수 계산
        const scores = duplicates
          .filter(d =>
            group.includes(d.originalId) && group.includes(d.duplicateId)
          )
          .map(d => d.similarityScore)

        const avgScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0

        groups.push({ ids: group, score: avgScore })
      }
    }
  }

  // 점수 높은 순으로 정렬
  return groups.sort((a, b) => b.score - a.score)
}

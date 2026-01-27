// 하이브리드 검색 관련 타입 정의

export interface SearchResult {
  id: string
  title: string
  organization: string
  category: string | null
  support_type: string | null
  support_amount: string | null
  application_end: string | null
  source: string
  similarity?: number // 벡터 검색 유사도 (0-1)
}

export interface HybridSearchOptions {
  limit?: number // 최종 반환 개수 (기본: 10)
  matchThreshold?: number // 벡터 검색 최소 유사도 (기본: 0.5)
  k?: number // RRF 파라미터 (기본: 60)
}

export interface RankedResult extends SearchResult {
  vectorRank?: number // 벡터 검색 순위 (1-based)
  keywordRank?: number // 키워드 검색 순위 (1-based)
  rrfScore: number // RRF 점수
}

export interface HybridSearchResult {
  results: RankedResult[]
  meta: {
    query: string
    totalResults: number
    searchType: 'hybrid' | 'vector' | 'keyword'
    vectorCount: number
    keywordCount: number
  }
}

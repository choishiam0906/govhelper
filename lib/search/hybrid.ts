// 하이브리드 검색 (벡터 + 키워드 결합) 함수

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/gemini'
import { getRagEmbeddingCache, setRagEmbeddingCache } from '@/lib/cache'
import { rerankWithGroq } from './reranker'
import type {
  SearchResult,
  HybridSearchOptions,
  RankedResult,
  HybridSearchResult,
} from './types'

/**
 * 벡터 검색 (시맨틱 검색)
 * @param query 검색 쿼리
 * @param limit 반환 개수
 * @param matchThreshold 최소 유사도 (0-1)
 * @returns 검색 결과 배열
 */
async function vectorSearch(
  query: string,
  limit: number,
  matchThreshold: number
): Promise<SearchResult[]> {
  const supabase = await createClient()

  // 검색어를 임베딩으로 변환 (캐시 우선)
  let queryEmbedding = await getRagEmbeddingCache(query)
  if (!queryEmbedding) {
    queryEmbedding = await generateEmbedding(query)
    await setRagEmbeddingCache(query, queryEmbedding)
  }

  // pgvector 시맨틱 검색
  const { data, error } = await (supabase.rpc as any)(
    'search_announcements_by_embedding',
    {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_threshold: matchThreshold,
      match_count: limit,
    }
  )

  if (error) {
    console.error('Vector search error:', error)
    return []
  }

  return data || []
}

/**
 * 키워드 검색 (전문 검색)
 * @param query 검색 쿼리
 * @param limit 반환 개수
 * @returns 검색 결과 배열
 */
async function keywordSearch(
  query: string,
  limit: number
): Promise<SearchResult[]> {
  const supabase = await createClient()

  // PostgreSQL ILIKE를 사용한 키워드 검색
  // title, organization, description 필드에서 검색
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, organization, category, support_type, support_amount, application_end, source')
    .eq('status', 'active')
    .or(`title.ilike.%${query}%,organization.ilike.%${query}%,description.ilike.%${query}%`)
    .order('application_end', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error('Keyword search error:', error)
    return []
  }

  return data || []
}

/**
 * RRF (Reciprocal Rank Fusion) 점수 계산
 * @param vectorRank 벡터 검색 순위 (0이면 결과에 없음)
 * @param keywordRank 키워드 검색 순위 (0이면 결과에 없음)
 * @param k RRF 파라미터 (기본: 60)
 * @returns RRF 점수
 */
function calculateRRFScore(
  vectorRank: number,
  keywordRank: number,
  k = 60
): number {
  let score = 0

  if (vectorRank > 0) {
    score += 1 / (k + vectorRank)
  }

  if (keywordRank > 0) {
    score += 1 / (k + keywordRank)
  }

  return score
}

/**
 * 결과 병합 (RRF 알고리즘)
 * @param vectorResults 벡터 검색 결과
 * @param keywordResults 키워드 검색 결과
 * @param k RRF 파라미터
 * @returns RRF 점수로 정렬된 결과
 */
function mergeResults(
  vectorResults: SearchResult[],
  keywordResults: SearchResult[],
  k: number
): RankedResult[] {
  // ID별 결과 맵 생성
  const resultMap = new Map<string, RankedResult>()

  // 벡터 검색 결과 추가 (순위는 1-based)
  vectorResults.forEach((result, index) => {
    resultMap.set(result.id, {
      ...result,
      vectorRank: index + 1,
      rrfScore: 0, // 나중에 계산
    })
  })

  // 키워드 검색 결과 추가
  keywordResults.forEach((result, index) => {
    const existing = resultMap.get(result.id)
    if (existing) {
      // 이미 벡터 검색에 있음 → 키워드 순위만 추가
      existing.keywordRank = index + 1
    } else {
      // 키워드 검색에만 있음
      resultMap.set(result.id, {
        ...result,
        keywordRank: index + 1,
        rrfScore: 0,
      })
    }
  })

  // RRF 점수 계산
  const merged = Array.from(resultMap.values()).map((result) => ({
    ...result,
    rrfScore: calculateRRFScore(
      result.vectorRank || 0,
      result.keywordRank || 0,
      k
    ),
  }))

  // RRF 점수로 정렬 (높은 순)
  merged.sort((a, b) => b.rrfScore - a.rrfScore)

  return merged
}

/**
 * 하이브리드 검색 (벡터 + 키워드 결합)
 * @param query 검색 쿼리
 * @param options 검색 옵션
 * @returns 하이브리드 검색 결과
 */
export async function hybridSearch(
  query: string,
  options: HybridSearchOptions = {}
): Promise<HybridSearchResult> {
  const {
    limit = 10,
    matchThreshold = 0.5,
    k = 60,
    useRerank = false,
  } = options

  try {
    // 1. 벡터 검색 (상위 20개)
    const vectorResults = await vectorSearch(query, 20, matchThreshold)

    // 2. 키워드 검색 (상위 20개)
    const keywordResults = await keywordSearch(query, 20)

    // 3. 결과 병합 (RRF)
    let merged = mergeResults(vectorResults, keywordResults, k)

    // 4. AI 재순위화 (선택적)
    if (useRerank) {
      // 상위 50개만 재순위화 (비용/속도 고려)
      const topForRerank = merged.slice(0, 50)
      const reranked = await rerankWithGroq(query, topForRerank)
      // 재순위화되지 않은 나머지는 그대로 추가
      merged = [...reranked, ...merged.slice(50)]
    }

    // 5. 상위 N개만 반환
    const finalResults = merged.slice(0, limit)

    return {
      results: finalResults,
      meta: {
        query,
        totalResults: finalResults.length,
        searchType: 'hybrid',
        vectorCount: vectorResults.length,
        keywordCount: keywordResults.length,
      },
    }
  } catch (error) {
    console.error('Hybrid search error:', error)
    throw error
  }
}

/**
 * 벡터 검색만 수행 (기존 시맨틱 검색 API 호환)
 */
export async function vectorSearchOnly(
  query: string,
  options: HybridSearchOptions = {}
): Promise<HybridSearchResult> {
  const {
    limit = 10,
    matchThreshold = 0.5,
  } = options

  try {
    const results = await vectorSearch(query, limit, matchThreshold)

    return {
      results: results.map((r) => ({
        ...r,
        rrfScore: r.similarity || 0,
      })),
      meta: {
        query,
        totalResults: results.length,
        searchType: 'vector',
        vectorCount: results.length,
        keywordCount: 0,
      },
    }
  } catch (error) {
    console.error('Vector search error:', error)
    throw error
  }
}

/**
 * 키워드 검색만 수행 (폴백용)
 */
export async function keywordSearchOnly(
  query: string,
  options: HybridSearchOptions = {}
): Promise<HybridSearchResult> {
  const { limit = 10 } = options

  try {
    const results = await keywordSearch(query, limit)

    return {
      results: results.map((r) => ({
        ...r,
        rrfScore: 1, // 키워드 검색은 순위만 있음
      })),
      meta: {
        query,
        totalResults: results.length,
        searchType: 'keyword',
        vectorCount: 0,
        keywordCount: results.length,
      },
    }
  } catch (error) {
    console.error('Keyword search error:', error)
    throw error
  }
}

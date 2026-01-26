/**
 * 회사 컨텍스트 RAG 검색
 * 사업계획서 등의 문서에서 관련 내용을 검색하여 AI에 컨텍스트 제공
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { generateEmbedding } from '@/lib/ai/gemini'

export interface RAGSearchResult {
  chunkId: string
  text: string
  similarity: number
}

/**
 * 회사 문서에서 관련 컨텍스트 검색
 */
export async function searchCompanyContext(
  supabase: SupabaseClient,
  companyId: string,
  query: string,
  limit: number = 5
): Promise<RAGSearchResult[]> {
  try {
    // 쿼리 임베딩 생성
    const queryEmbedding = await generateEmbedding(query)

    if (!queryEmbedding) {
      console.error('쿼리 임베딩 생성 실패')
      return []
    }

    // 벡터 검색 (RPC 함수 사용)
    const { data, error } = await supabase.rpc('search_company_context', {
      p_company_id: companyId,
      p_query_embedding: queryEmbedding,
      p_limit: limit,
    })

    if (error) {
      console.error('RAG 검색 실패:', error)
      return []
    }

    return (data || []).map((item: { chunk_id: string; chunk_text: string; similarity: number }) => ({
      chunkId: item.chunk_id,
      text: item.chunk_text,
      similarity: item.similarity,
    }))
  } catch (error) {
    console.error('RAG 검색 오류:', error)
    return []
  }
}

/**
 * AI 프롬프트용 컨텍스트 포맷팅
 */
export function formatContextForPrompt(
  results: RAGSearchResult[],
  maxLength: number = 3000
): string {
  if (results.length === 0) {
    return ''
  }

  let context = '## 기업 사업계획서 내용\n\n'
  let currentLength = context.length

  for (const result of results) {
    const chunk = `### 관련 내용 (유사도: ${(result.similarity * 100).toFixed(1)}%)\n${result.text}\n\n`

    if (currentLength + chunk.length > maxLength) {
      break
    }

    context += chunk
    currentLength += chunk.length
  }

  return context.trim()
}

/**
 * 매칭 분석용 회사 컨텍스트 조회
 * - 회사의 사업 분야
 * - 기술력 및 역량
 * - 팀 구성
 * - 사업 목표
 */
export async function getCompanyContextForMatching(
  supabase: SupabaseClient,
  companyId: string,
  announcementTitle: string,
  announcementDescription: string
): Promise<string> {
  // 공고 내용을 쿼리로 사용하여 관련 회사 컨텍스트 검색
  const query = `${announcementTitle} ${announcementDescription.slice(0, 500)}`

  const results = await searchCompanyContext(supabase, companyId, query, 5)

  return formatContextForPrompt(results, 2000)
}

/**
 * 지원서 작성용 회사 컨텍스트 조회
 * - 더 많은 컨텍스트 필요
 */
export async function getCompanyContextForApplication(
  supabase: SupabaseClient,
  companyId: string,
  section: string // 지원서 섹션 (예: "사업 개요", "기술 역량" 등)
): Promise<string> {
  const results = await searchCompanyContext(supabase, companyId, section, 8)

  return formatContextForPrompt(results, 4000)
}

/**
 * 회사 문서가 있는지 확인
 */
export async function hasCompanyDocuments(
  supabase: SupabaseClient,
  companyId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('company_document_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  if (error) {
    console.error('문서 확인 실패:', error)
    return false
  }

  return (count || 0) > 0
}

/**
 * 회사의 전체 문서 요약 가져오기
 * (임베딩 없이 직접 텍스트 조회)
 */
export async function getCompanyDocumentSummary(
  supabase: SupabaseClient,
  companyId: string,
  maxChunks: number = 10
): Promise<string> {
  const { data, error } = await supabase
    .from('company_document_chunks')
    .select('chunk_text')
    .eq('company_id', companyId)
    .order('chunk_index', { ascending: true })
    .limit(maxChunks)

  if (error || !data || data.length === 0) {
    return ''
  }

  return data.map((d) => d.chunk_text).join('\n\n')
}

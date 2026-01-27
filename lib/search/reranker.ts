/**
 * AI 재순위화 함수 (Groq LLM)
 *
 * 하이브리드 검색 결과를 Groq LLM으로 재순위화하여 검색 품질 향상
 */

import Groq from 'groq-sdk'
import type { RankedResult } from './types'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
})

const MODEL_NAME = 'llama-3.3-70b-versatile'

interface RerankScore {
  id: string
  score: number
}

interface RerankResponse {
  scores: RerankScore[]
}

/**
 * AI 재순위화 함수
 *
 * @param query 검색어
 * @param results 하이브리드 검색 결과 (최대 50개)
 * @returns 재순위화된 결과
 */
export async function rerankWithGroq(
  query: string,
  results: RankedResult[]
): Promise<RankedResult[]> {
  if (results.length === 0) {
    return results
  }

  try {
    // 프롬프트 구성
    const announcementList = results.map((r, idx) => {
      const title = r.title || '제목 없음'
      const org = r.organization || '기관 미상'
      const category = r.category || '분류 없음'
      const amount = r.support_amount || '금액 미정'

      return `${idx + 1}. ID: ${r.id} | 제목: ${title} | 기관: ${org} | 분류: ${category} | 금액: ${amount}`
    }).join('\n')

    const prompt = `사용자 검색어: "${query}"

다음 정부지원사업 공고들의 검색어와의 관련성을 평가해주세요.
각 공고에 0-100점의 관련성 점수를 부여하세요.

[공고 목록]
${announcementList}

평가 기준:
1. 제목과 검색어의 의미론적 유사성 (40점)
2. 기관/분류/금액이 검색어와 관련성 (30점)
3. 검색어 키워드 포함 여부 (20점)
4. 공고의 구체성/명확성 (10점)

JSON 형식으로 응답:
{ "scores": [{ "id": "공고ID", "score": 점수 }, ...] }

주의: scores 배열은 반드시 위 ${results.length}개 공고 전체를 포함해야 합니다.`

    // Groq API 호출
    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: '당신은 정부지원사업 검색 전문가입니다. JSON 형식으로만 응답하세요.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // 일관성을 위해 낮게 설정
      max_tokens: 2048,
    })

    const text = completion.choices[0]?.message?.content || ''

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Failed to parse Groq response:', text)
      return results // graceful degradation
    }

    const response: RerankResponse = JSON.parse(jsonMatch[0])

    if (!response.scores || !Array.isArray(response.scores)) {
      console.error('Invalid Groq response format:', response)
      return results
    }

    // 점수 맵 생성
    const scoreMap = new Map<string, number>()
    response.scores.forEach(({ id, score }) => {
      scoreMap.set(id, score)
    })

    // 재순위화된 결과 생성
    const reranked = results.map((r) => ({
      ...r,
      rerankScore: scoreMap.get(r.id) ?? 0, // AI 재순위화 점수 추가
    }))

    // 재순위화 점수로 정렬 (높은 순)
    reranked.sort((a, b) => (b.rerankScore ?? 0) - (a.rerankScore ?? 0))

    return reranked
  } catch (error) {
    console.error('Groq reranking error:', error)
    // 에러 발생 시 원본 결과 반환 (graceful degradation)
    return results
  }
}

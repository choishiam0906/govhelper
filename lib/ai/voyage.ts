/**
 * Voyage AI 임베딩 모듈
 *
 * Gemini 임베딩 백업용
 * - 모델: voyage-multilingual-2 (한국어 우수)
 * - 차원: 1024 → 768로 조정 (Gemini 호환)
 */

// Voyage AI 설정
const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-multilingual-2' // 한국어 지원 우수

// Voyage 사용 가능 여부 확인
export function isVoyageAvailable(): boolean {
  return !!process.env.VOYAGE_API_KEY
}

/**
 * Voyage AI로 임베딩 생성
 * @param text 임베딩할 텍스트
 * @returns 768차원 벡터 (Gemini 호환)
 */
export async function generateEmbeddingWithVoyage(text: string): Promise<number[]> {
  if (!process.env.VOYAGE_API_KEY) {
    throw new Error('VOYAGE_API_KEY is not set')
  }

  try {
    const response = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: VOYAGE_MODEL,
        input: [text],
        input_type: 'document',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Voyage API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const embedding: number[] = data.data[0].embedding

    // Voyage는 1024차원, Gemini는 768차원
    // pgvector 테이블이 768차원으로 설정되어 있으므로 조정 필요
    // 앞 768개만 사용 (차원 축소)
    const adjustedEmbedding = embedding.slice(0, 768)

    console.log(`[Voyage] Generated embedding: ${embedding.length}D → ${adjustedEmbedding.length}D`)
    return adjustedEmbedding
  } catch (error) {
    console.error('Voyage embedding error:', error)
    throw error
  }
}

/**
 * 배치 임베딩 생성 (여러 텍스트 한번에)
 * @param texts 임베딩할 텍스트 배열
 * @returns 768차원 벡터 배열
 */
export async function generateEmbeddingsBatchWithVoyage(texts: string[]): Promise<number[][]> {
  if (!process.env.VOYAGE_API_KEY) {
    throw new Error('VOYAGE_API_KEY is not set')
  }

  try {
    const response = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: VOYAGE_MODEL,
        input: texts,
        input_type: 'document',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Voyage API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    // 각 임베딩을 768차원으로 조정
    const embeddings: number[][] = data.data.map((item: { embedding: number[] }) =>
      item.embedding.slice(0, 768)
    )

    console.log(`[Voyage] Generated ${embeddings.length} embeddings (adjusted to 768D)`)
    return embeddings
  } catch (error) {
    console.error('Voyage batch embedding error:', error)
    throw error
  }
}

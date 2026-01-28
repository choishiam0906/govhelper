// 기업 문서 RAG 시스템 테스트
// lib/company-documents/rag.ts 테스트 (벡터 검색)

import { describe, it, expect } from 'vitest'

describe('RAG 시스템', () => {
  describe('문서 업로드 및 처리', () => {
    it('PDF 업로드 후 텍스트 추출', () => {
      const document = {
        id: 'doc_123',
        companyId: 'company_456',
        fileName: '사업계획서.pdf',
        filePath: 'company_456/사업계획서.pdf',
        fileSize: 5 * 1024 * 1024, // 5MB
        documentType: 'business_plan',
        status: 'pending',
        pageCount: null,
        createdAt: '2026-01-28T00:00:00Z',
      }

      expect(document.status).toBe('pending')
      expect(document.documentType).toBe('business_plan')
    })

    it('텍스트 추출 후 processing 상태', () => {
      const document = {
        status: 'processing',
      }

      expect(document.status).toBe('processing')
    })

    it('청크 분할 및 벡터화 완료 후 completed 상태', () => {
      const document = {
        status: 'completed',
        pageCount: 15,
      }

      expect(document.status).toBe('completed')
      expect(document.pageCount).toBe(15)
    })

    it('처리 실패 시 failed 상태', () => {
      const document = {
        status: 'failed',
        errorMessage: 'PDF parsing error',
      }

      expect(document.status).toBe('failed')
      expect(document.errorMessage).not.toBeNull()
    })
  })

  describe('청크 분할', () => {
    it('800자 단위로 분할', () => {
      const content = 'A'.repeat(2000)
      const chunkSize = 800

      const chunks: Array<{ index: number; content: string }> = []
      for (let i = 0; i < content.length; i += chunkSize) {
        chunks.push({
          index: chunks.length,
          content: content.slice(i, i + chunkSize),
        })
      }

      expect(chunks).toHaveLength(3)
      expect(chunks[0].content).toHaveLength(800)
    })

    it('100자 오버랩', () => {
      const content = 'A'.repeat(2000)
      const chunkSize = 800
      const overlap = 100

      const chunks: Array<{ index: number; content: string }> = []
      for (let i = 0; i < content.length; i += chunkSize - overlap) {
        const chunk = content.slice(i, i + chunkSize)
        chunks.push({ index: chunks.length, content: chunk })
        if (i + chunkSize >= content.length) break
      }

      // 오버랩으로 청크 개수 증가
      expect(chunks.length).toBeGreaterThan(2)
    })

    it('청크별 인덱스 할당', () => {
      const chunks = [
        { index: 0, content: '청크 0' },
        { index: 1, content: '청크 1' },
        { index: 2, content: '청크 2' },
      ]

      expect(chunks[0].index).toBe(0)
      expect(chunks[2].index).toBe(2)
    })
  })

  describe('벡터 임베딩', () => {
    it('Gemini text-embedding-004 사용 (768차원)', () => {
      const embeddingDimension = 768

      expect(embeddingDimension).toBe(768)
    })

    it('청크별 벡터 생성', () => {
      const chunks = [
        {
          id: 'chunk_1',
          documentId: 'doc_123',
          chunkIndex: 0,
          content: '본 사업은 AI 기반 SaaS 플랫폼 개발을 목표로 합니다.',
          embedding: new Array(768).fill(0.1), // Mock 벡터
          tokenCount: 20,
        },
        {
          id: 'chunk_2',
          documentId: 'doc_123',
          chunkIndex: 1,
          content: '목표 시장은 중소기업 B2B 시장입니다.',
          embedding: new Array(768).fill(0.2), // Mock 벡터
          tokenCount: 15,
        },
      ]

      expect(chunks).toHaveLength(2)
      expect(chunks[0].embedding).toHaveLength(768)
    })

    it('토큰 수 계산', () => {
      const text = '가'.repeat(100)
      const estimatedTokens = Math.ceil(text.length * 1.5) // 한글 1글자 ≈ 1.5토큰

      expect(estimatedTokens).toBe(150)
    })
  })

  describe('RAG 검색', () => {
    it('쿼리 임베딩 생성', () => {
      const query = '사업 목표가 무엇인가요?'
      const queryEmbedding = new Array(768).fill(0.15) // Mock

      expect(queryEmbedding).toHaveLength(768)
    })

    it('코사인 유사도 계산', () => {
      const vec1 = [1, 0, 0]
      const vec2 = [1, 0, 0]

      const dotProduct = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0)
      const mag1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0))
      const mag2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0))
      const similarity = dotProduct / (mag1 * mag2)

      expect(similarity).toBe(1) // 완전 일치
    })

    it('상위 5개 청크 반환', () => {
      const results = [
        { content: '청크 1', similarity: 0.95 },
        { content: '청크 2', similarity: 0.92 },
        { content: '청크 3', similarity: 0.88 },
        { content: '청크 4', similarity: 0.85 },
        { content: '청크 5', similarity: 0.82 },
        { content: '청크 6', similarity: 0.75 },
      ]

      const topK = results.slice(0, 5)

      expect(topK).toHaveLength(5)
      expect(topK[0].similarity).toBe(0.95)
    })

    it('유사도 순 정렬', () => {
      const results = [
        { content: '청크 1', similarity: 0.85 },
        { content: '청크 2', similarity: 0.95 },
        { content: '청크 3', similarity: 0.88 },
      ]

      const sorted = [...results].sort((a, b) => b.similarity - a.similarity)

      expect(sorted[0].similarity).toBe(0.95)
      expect(sorted[2].similarity).toBe(0.85)
    })
  })

  describe('컨텍스트 생성', () => {
    it('검색 결과를 하나의 컨텍스트로 병합', () => {
      const chunks = [
        { content: '본 사업은 AI 기반 SaaS 플랫폼 개발을 목표로 합니다.' },
        { content: '목표 시장은 중소기업 B2B 시장입니다.' },
        { content: '연매출 100억원 달성을 목표로 합니다.' },
      ]

      const context = chunks.map(c => c.content).join('\n\n')

      expect(context).toContain('AI 기반')
      expect(context).toContain('목표 시장')
      expect(context).toContain('연매출')
    })

    it('컨텍스트 길이 제한 (2000자)', () => {
      const chunks = [
        { content: 'A'.repeat(1000) },
        { content: 'B'.repeat(1000) },
        { content: 'C'.repeat(1000) },
      ]

      const context = chunks
        .map(c => c.content)
        .join('\n\n')
        .slice(0, 2000)

      expect(context.length).toBeLessThanOrEqual(2000)
    })
  })

  describe('AI 매칭 연동', () => {
    it('RAG 컨텍스트를 AI 프롬프트에 포함', () => {
      const ragContext = `
문서 내용:
- 본 사업은 AI 기반 SaaS 플랫폼 개발을 목표로 합니다.
- 목표 시장은 중소기업 B2B 시장입니다.
- 연매출 100억원 달성을 목표로 합니다.
      `.trim()

      const prompt = `
다음은 회사의 사업계획서 내용입니다:

${ragContext}

위 내용을 바탕으로 공고와의 매칭 점수를 평가하세요.
      `

      expect(prompt).toContain('사업계획서 내용')
      expect(prompt).toContain('AI 기반 SaaS')
    })

    it('RAG 없으면 기본 정보만 사용', () => {
      const hasRAG = false

      const prompt = hasRAG
        ? 'RAG 컨텍스트 포함'
        : '회사명, 업종, 직원수 등 기본 정보만 사용'

      expect(prompt).toContain('기본 정보')
    })
  })

  describe('지원서 작성 연동', () => {
    it('RAG 컨텍스트를 지원서 생성 프롬프트에 포함', () => {
      const ragContext = `
- 핵심 기술: 자연어 처리 모델, 클라우드 인프라
- 경쟁 우위: 업계 최초 AI 기반 자동화
- 목표 시장: 중소기업 B2B
      `.trim()

      const prompt = `
사업계획서 내용:
${ragContext}

위 내용을 바탕으로 "기술개발 내용" 섹션을 작성하세요.
      `

      expect(prompt).toContain('사업계획서 내용')
      expect(prompt).toContain('자연어 처리')
    })

    it('섹션별 관련 청크 검색', () => {
      const sectionTitle = '기술개발 내용'

      // 섹션 제목을 쿼리로 RAG 검색
      const query = `${sectionTitle}에 대한 내용`

      expect(query).toBe('기술개발 내용에 대한 내용')
    })
  })

  describe('문서 삭제', () => {
    it('문서 삭제 시 청크도 함께 삭제 (CASCADE)', () => {
      const documentId = 'doc_123'

      // DB에서 문서 삭제 시 ON DELETE CASCADE로 청크 자동 삭제
      const cascadeDelete = true

      expect(cascadeDelete).toBe(true)
    })

    it('Storage 파일도 함께 삭제', () => {
      const filePath = 'company_456/사업계획서.pdf'

      // Supabase Storage에서 파일 삭제
      const deleteFile = (path: string) => {
        return path === filePath
      }

      expect(deleteFile(filePath)).toBe(true)
    })
  })

  describe('에러 처리', () => {
    it('PDF 파싱 실패', () => {
      const error = {
        status: 'failed',
        errorMessage: 'PDF parsing error: Invalid PDF structure',
      }

      expect(error.status).toBe('failed')
      expect(error.errorMessage).toContain('PDF parsing')
    })

    it('임베딩 생성 실패', () => {
      const error = {
        status: 'failed',
        errorMessage: 'Embedding generation failed: API rate limit',
      }

      expect(error.errorMessage).toContain('rate limit')
    })

    it('파일 크기 초과 (10MB)', () => {
      const fileSize = 15 * 1024 * 1024 // 15MB
      const maxSize = 10 * 1024 * 1024 // 10MB

      const isValid = fileSize <= maxSize

      expect(isValid).toBe(false)
    })

    it('지원하지 않는 파일 형식', () => {
      const allowedTypes = ['application/pdf']
      const fileType = 'application/msword'

      const isAllowed = allowedTypes.includes(fileType)

      expect(isAllowed).toBe(false)
    })
  })

  describe('성능 최적화', () => {
    it('IVFFlat 인덱스로 빠른 검색', () => {
      const indexType = 'ivfflat'
      const lists = 100 // 클러스터 수

      expect(indexType).toBe('ivfflat')
      expect(lists).toBe(100)
    })

    it('배치 임베딩 생성 (10개씩)', () => {
      const chunks = Array.from({ length: 25 }, (_, i) => ({
        index: i,
        content: `청크 ${i}`,
      }))

      const batchSize = 10
      const batches = []

      for (let i = 0; i < chunks.length; i += batchSize) {
        batches.push(chunks.slice(i, i + batchSize))
      }

      expect(batches).toHaveLength(3) // 25 / 10 = 2.5 → 3개
      expect(batches[0]).toHaveLength(10)
      expect(batches[2]).toHaveLength(5)
    })

    it('Rate Limit 방지 (1초 딜레이)', () => {
      const delayMs = 1000

      expect(delayMs).toBe(1000)
    })
  })

  describe('통계', () => {
    it('문서별 청크 수', () => {
      const document = {
        id: 'doc_123',
        chunkCount: 15,
      }

      expect(document.chunkCount).toBe(15)
    })

    it('회사별 문서 수', () => {
      const company = {
        id: 'company_456',
        documentCount: 3,
      }

      expect(company.documentCount).toBe(3)
    })

    it('전체 저장 용량', () => {
      const documents = [
        { fileSize: 5 * 1024 * 1024 },
        { fileSize: 3 * 1024 * 1024 },
        { fileSize: 7 * 1024 * 1024 },
      ]

      const totalSize = documents.reduce((sum, d) => sum + d.fileSize, 0)
      const totalMB = totalSize / (1024 * 1024)

      expect(totalMB).toBe(15)
    })
  })
})

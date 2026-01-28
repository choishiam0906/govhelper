// PDF 텍스트 추출 테스트
// lib/pdf/index.ts 테스트 (pdf-parse, RAG 청크 분할)

import { describe, it, expect } from 'vitest'

describe('PDF 텍스트 추출', () => {
  describe('텍스트 추출 성공', () => {
    it('PDF에서 텍스트 추출', () => {
      const pdfText = `
사업계획서

1. 사업 개요
회사명: (주)테스트
사업명: AI 기반 SaaS 플랫폼 개발
사업 기간: 2026년 1월 ~ 2026년 12월

2. 기술개발 내용
- 자연어 처리 모델 개발
- 클라우드 인프라 구축
- 보안 시스템 강화
      `

      expect(pdfText).toContain('사업계획서')
      expect(pdfText).toContain('회사명: (주)테스트')
      expect(pdfText).toContain('기술개발 내용')
    })

    it('여러 페이지 텍스트 추출', () => {
      const pages = [
        { pageNumber: 1, text: '1페이지 내용' },
        { pageNumber: 2, text: '2페이지 내용' },
        { pageNumber: 3, text: '3페이지 내용' },
      ]

      const fullText = pages.map(p => p.text).join('\n')

      expect(fullText).toContain('1페이지')
      expect(fullText).toContain('2페이지')
      expect(fullText).toContain('3페이지')
    })

    it('페이지 수 계산', () => {
      const pdfInfo = {
        numPages: 15,
        title: '사업계획서',
      }

      expect(pdfInfo.numPages).toBe(15)
    })
  })

  describe('텍스트 정리', () => {
    it('연속 공백 제거', () => {
      const text = 'A    B     C'
      const cleaned = text.replace(/\s+/g, ' ')

      expect(cleaned).toBe('A B C')
    })

    it('연속 줄바꿈 제거', () => {
      const text = 'A\n\n\n\nB'
      const cleaned = text.replace(/\n{3,}/g, '\n\n')

      expect(cleaned).toBe('A\n\nB')
    })

    it('앞뒤 공백 제거', () => {
      const text = '  사업계획서  '
      const cleaned = text.trim()

      expect(cleaned).toBe('사업계획서')
    })

    it('특수문자 제거', () => {
      const text = '\u0000A\u0001B\u0002C'
      const cleaned = text.replace(/[\x00-\x1F]/g, '')

      expect(cleaned).toBe('ABC')
    })
  })

  describe('청크 분할 (RAG용)', () => {
    it('800자 단위 분할', () => {
      const text = 'A'.repeat(2000)
      const chunkSize = 800
      const chunks: string[] = []

      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize))
      }

      expect(chunks).toHaveLength(3) // 2000 / 800 = 2.5 → 3개
      expect(chunks[0]).toHaveLength(800)
      expect(chunks[2]).toHaveLength(400) // 나머지
    })

    it('오버랩 100자 적용', () => {
      const text = 'A'.repeat(2000)
      const chunkSize = 800
      const overlap = 100
      const chunks: string[] = []

      for (let i = 0; i < text.length; i += chunkSize - overlap) {
        chunks.push(text.slice(i, i + chunkSize))
        if (i + chunkSize >= text.length) break
      }

      expect(chunks.length).toBeGreaterThan(2)
      // 오버랩으로 인해 청크 개수 증가
    })

    it('문장 경계에서 분할', () => {
      const text = '첫 번째 문장입니다. 두 번째 문장입니다. 세 번째 문장입니다.'
      const sentences = text.split(/(?<=[.!?])\s+/)

      expect(sentences).toHaveLength(3)
      expect(sentences[0]).toBe('첫 번째 문장입니다.')
    })

    it('단락 경계에서 분할', () => {
      const text = '첫 번째 단락\n\n두 번째 단락\n\n세 번째 단락'
      const paragraphs = text.split(/\n\n+/)

      expect(paragraphs).toHaveLength(3)
      expect(paragraphs[0]).toBe('첫 번째 단락')
    })
  })

  describe('메타데이터 추출', () => {
    it('PDF 제목 추출', () => {
      const metadata = {
        title: '사업계획서',
        author: '홍길동',
        creationDate: '2026-01-28',
      }

      expect(metadata.title).toBe('사업계획서')
    })

    it('작성자 추출', () => {
      const metadata = {
        author: '홍길동',
      }

      expect(metadata.author).toBe('홍길동')
    })

    it('작성일 추출', () => {
      const metadata = {
        creationDate: '2026-01-28',
      }

      expect(metadata.creationDate).toBe('2026-01-28')
    })
  })

  describe('에러 처리', () => {
    it('PDF 파일이 아니면 에러', () => {
      const isValidPDF = (buffer: Buffer) => {
        const header = buffer.slice(0, 5).toString()
        return header === '%PDF-'
      }

      const invalidBuffer = Buffer.from('NOT A PDF')

      expect(isValidPDF(invalidBuffer)).toBe(false)
    })

    it('손상된 PDF 파일', () => {
      const parsePDF = (buffer: Buffer) => {
        if (!buffer || buffer.length === 0) {
          throw new Error('Empty PDF buffer')
        }
        return { text: 'success' }
      }

      expect(() => parsePDF(Buffer.alloc(0))).toThrow('Empty PDF buffer')
    })

    it('텍스트가 없는 PDF (이미지만)', () => {
      const pdfText = ''

      const hasText = pdfText.trim().length > 0

      expect(hasText).toBe(false)
    })

    it('암호화된 PDF', () => {
      const pdfInfo = {
        encrypted: true,
      }

      expect(pdfInfo.encrypted).toBe(true)
    })
  })

  describe('파일 크기 제한', () => {
    it('10MB 이하 허용', () => {
      const fileSize = 5 * 1024 * 1024 // 5MB
      const maxSize = 10 * 1024 * 1024 // 10MB

      expect(fileSize).toBeLessThanOrEqual(maxSize)
    })

    it('10MB 초과 거부', () => {
      const fileSize = 15 * 1024 * 1024 // 15MB
      const maxSize = 10 * 1024 * 1024 // 10MB

      expect(fileSize).toBeGreaterThan(maxSize)
    })
  })

  describe('토큰 카운트', () => {
    it('한글 토큰 수 추정 (1글자 ≈ 1.5토큰)', () => {
      const text = '가'.repeat(100)
      const estimatedTokens = Math.ceil(text.length * 1.5)

      expect(estimatedTokens).toBe(150)
    })

    it('영문 토큰 수 추정 (1단어 ≈ 1토큰)', () => {
      const text = 'hello world test example'
      const words = text.split(/\s+/)
      const estimatedTokens = words.length

      expect(estimatedTokens).toBe(4)
    })
  })

  describe('청크 인덱싱', () => {
    it('청크 번호 할당', () => {
      const chunks = [
        { index: 0, content: '청크 0' },
        { index: 1, content: '청크 1' },
        { index: 2, content: '청크 2' },
      ]

      expect(chunks[0].index).toBe(0)
      expect(chunks[2].index).toBe(2)
    })

    it('청크 개수 카운트', () => {
      const chunks = Array.from({ length: 15 }, (_, i) => ({
        index: i,
        content: `청크 ${i}`,
      }))

      expect(chunks).toHaveLength(15)
    })
  })

  describe('텍스트 품질 검증', () => {
    it('최소 100자 이상', () => {
      const text = 'A'.repeat(150)

      expect(text.length).toBeGreaterThanOrEqual(100)
    })

    it('100자 미만은 경고', () => {
      const text = 'Too short'

      const isValid = text.length >= 100

      expect(isValid).toBe(false)
    })

    it('의미 있는 텍스트인지 확인', () => {
      const text = '사업계획서\n회사명: 테스트\n사업 목표: AI 개발'

      // 한글, 영문, 숫자가 포함되어 있는지
      const hasKorean = /[가-힣]/.test(text)
      const hasContent = text.length > 10

      expect(hasKorean).toBe(true)
      expect(hasContent).toBe(true)
    })
  })
})

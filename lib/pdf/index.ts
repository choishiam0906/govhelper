/**
 * PDF 처리 유틸리티
 * pdf-parse를 사용하여 PDF에서 텍스트 추출
 */

// Node.js 서버 환경에서 필요한 폴리필
if (typeof globalThis.DOMMatrix === 'undefined') {
  // @ts-expect-error - DOMMatrix polyfill for Node.js
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
    }
  }
}

export interface PDFExtractResult {
  success: boolean
  text: string
  pageCount: number
  info?: {
    title?: string
    author?: string
    subject?: string
    creator?: string
  }
  error?: string
}

/**
 * PDF 버퍼에서 텍스트 추출
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<PDFExtractResult> {
  try {
    // pdf-parse 모듈 로드 (default export 처리)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParseModule = require('pdf-parse')
    const pdf = pdfParseModule.default || pdfParseModule

    // 커스텀 옵션으로 파싱 (테스트 파일 로드 방지)
    const options = {
      // 페이지 렌더링 콜백 비활성화
      pagerender: undefined,
    }

    const data = await pdf(buffer, options)

    return {
      success: true,
      text: data.text,
      pageCount: data.numpages,
      info: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        creator: data.info?.Creator,
      },
    }
  } catch (error) {
    console.error('PDF 텍스트 추출 실패:', error)
    return {
      success: false,
      text: '',
      pageCount: 0,
      error: error instanceof Error ? error.message : 'PDF 파싱 실패',
    }
  }
}

/**
 * 텍스트를 청크로 분할
 * - 문단 단위로 우선 분할
 * - 너무 긴 문단은 문장 단위로 재분할
 */
export interface TextChunk {
  index: number
  text: string
  tokenCount: number // 추정 토큰 수
}

const CHUNK_SIZE = 800 // 목표 청크 크기 (문자)
const CHUNK_OVERLAP = 100 // 청크 간 오버랩

export function chunkText(text: string): TextChunk[] {
  // 텍스트 정리
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // 과도한 줄바꿈 제거
    .replace(/[ \t]+/g, ' ') // 과도한 공백 제거
    .trim()

  if (!cleanedText) {
    return []
  }

  const chunks: TextChunk[] = []
  let currentChunk = ''
  let chunkIndex = 0

  // 문단 단위로 분할
  const paragraphs = cleanedText.split(/\n\n+/)

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim()
    if (!trimmedParagraph) continue

    // 현재 청크에 문단 추가 가능한지 확인
    if (currentChunk.length + trimmedParagraph.length <= CHUNK_SIZE) {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph
    } else {
      // 현재 청크 저장
      if (currentChunk) {
        chunks.push({
          index: chunkIndex++,
          text: currentChunk,
          tokenCount: estimateTokenCount(currentChunk),
        })
      }

      // 문단이 너무 긴 경우 문장 단위로 분할
      if (trimmedParagraph.length > CHUNK_SIZE) {
        const subChunks = splitLongParagraph(trimmedParagraph, chunkIndex)
        chunks.push(...subChunks)
        chunkIndex += subChunks.length
        currentChunk = ''
      } else {
        // 오버랩 적용
        const overlapText = getOverlapText(currentChunk, CHUNK_OVERLAP)
        currentChunk = overlapText + (overlapText ? '\n\n' : '') + trimmedParagraph
      }
    }
  }

  // 마지막 청크 저장
  if (currentChunk.trim()) {
    chunks.push({
      index: chunkIndex,
      text: currentChunk.trim(),
      tokenCount: estimateTokenCount(currentChunk),
    })
  }

  return chunks
}

/**
 * 긴 문단을 문장 단위로 분할
 */
function splitLongParagraph(paragraph: string, startIndex: number): TextChunk[] {
  const chunks: TextChunk[] = []
  const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph]

  let currentChunk = ''
  let chunkIndex = startIndex

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim()

    if (currentChunk.length + trimmedSentence.length <= CHUNK_SIZE) {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence
    } else {
      if (currentChunk) {
        chunks.push({
          index: chunkIndex++,
          text: currentChunk,
          tokenCount: estimateTokenCount(currentChunk),
        })
      }
      currentChunk = trimmedSentence
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      index: chunkIndex,
      text: currentChunk.trim(),
      tokenCount: estimateTokenCount(currentChunk),
    })
  }

  return chunks
}

/**
 * 오버랩용 텍스트 추출 (마지막 N자)
 */
function getOverlapText(text: string, overlapSize: number): string {
  if (!text || text.length <= overlapSize) return ''

  // 단어 경계에서 자르기
  const lastPart = text.slice(-overlapSize * 2)
  const words = lastPart.split(/\s+/)

  let result = ''
  for (let i = words.length - 1; i >= 0; i--) {
    const newResult = words.slice(i).join(' ')
    if (newResult.length > overlapSize) break
    result = newResult
  }

  return result
}

/**
 * 토큰 수 추정 (한글 기준 대략적)
 * - 영어: ~4자 = 1토큰
 * - 한글: ~2자 = 1토큰 (대략적)
 */
function estimateTokenCount(text: string): number {
  const koreanChars = (text.match(/[\uac00-\ud7af]/g) || []).length
  const otherChars = text.length - koreanChars

  return Math.ceil(koreanChars / 2 + otherChars / 4)
}

/**
 * 마크다운으로 변환 (간단한 포맷팅)
 */
export function textToMarkdown(text: string, title?: string): string {
  let md = ''

  if (title) {
    md += `# ${title}\n\n`
  }

  // 문단 분할 및 포맷팅
  const paragraphs = text.split(/\n\n+/)

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim()
    if (!trimmed) continue

    // 번호 목록 감지
    if (/^\d+[.)]\s/.test(trimmed)) {
      md += trimmed + '\n\n'
    }
    // 불릿 목록 감지
    else if (/^[-•*]\s/.test(trimmed)) {
      md += trimmed + '\n\n'
    }
    // 일반 문단
    else {
      md += trimmed + '\n\n'
    }
  }

  return md.trim()
}

/**
 * 통합 문서 파서
 * PDF, HWP, HWPX, DOCX 등 다양한 문서 형식에서 텍스트 추출
 */

import { extractTextFromPDF } from '@/lib/pdf'

export interface DocumentParseResult {
  success: boolean
  text: string
  pageCount?: number
  format: string
  error?: string
}

/**
 * 파일 확장자 추출
 */
function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const ext = pathname.split('.').pop()?.toLowerCase() || ''
    return ext
  } catch {
    // URL이 아닌 경우 직접 추출
    const ext = url.split('.').pop()?.toLowerCase() || ''
    return ext
  }
}

/**
 * PDF 파일에서 텍스트 추출
 */
async function parsePDF(buffer: Buffer): Promise<DocumentParseResult> {
  try {
    const result = await extractTextFromPDF(buffer)
    return {
      success: result.success,
      text: result.text,
      pageCount: result.pageCount,
      format: 'pdf',
      error: result.error,
    }
  } catch (error) {
    return {
      success: false,
      text: '',
      format: 'pdf',
      error: error instanceof Error ? error.message : 'PDF 파싱 실패',
    }
  }
}

/**
 * HWP 파일에서 텍스트 추출 (hwp.js 사용)
 */
async function parseHWP(buffer: Buffer): Promise<DocumentParseResult> {
  try {
    // hwp.js 동적 import
    const { parse } = await import('hwp.js')

    // Buffer를 Uint8Array로 변환 (hwp.js가 요구하는 형식)
    const uint8Array = new Uint8Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    )

    // HWP 문서 파싱
    const hwpDoc = parse(uint8Array, { type: 'array' })

    // 텍스트 추출
    let text = ''

    // hwp.js의 구조에 맞게 텍스트 추출 (화살표 함수 사용)
    const extractText = (node: unknown): void => {
      if (!node || typeof node !== 'object') return

      const obj = node as Record<string, unknown>

      // 텍스트 노드인 경우
      if (typeof obj.text === 'string') {
        text += obj.text
      }

      // content 배열 처리
      if (Array.isArray(obj.content)) {
        for (const item of obj.content) {
          extractText(item)
        }
        text += '\n'
      }

      // sections 처리
      if (Array.isArray(obj.sections)) {
        for (const section of obj.sections) {
          extractText(section)
        }
      }

      // paragraphs 처리
      if (Array.isArray(obj.paragraphs)) {
        for (const paragraph of obj.paragraphs) {
          extractText(paragraph)
        }
      }

      // children 처리
      if (Array.isArray(obj.children)) {
        for (const child of obj.children) {
          extractText(child)
        }
      }
    }

    extractText(hwpDoc)

    return {
      success: true,
      text: text.trim(),
      format: 'hwp',
    }
  } catch (error) {
    console.error('HWP 파싱 오류:', error)
    return {
      success: false,
      text: '',
      format: 'hwp',
      error: error instanceof Error ? error.message : 'HWP 파싱 실패',
    }
  }
}

/**
 * HWPX 파일에서 텍스트 추출 (ZIP + XML 구조)
 */
async function parseHWPX(buffer: Buffer): Promise<DocumentParseResult> {
  try {
    const JSZipModule = await import('jszip')
    const JSZip = JSZipModule.default || JSZipModule
    const zip = await JSZip.loadAsync(buffer)

    let text = ''

    // Contents/section*.xml 파일들에서 텍스트 추출
    const sectionFiles = Object.keys(zip.files).filter(
      (name) => name.startsWith('Contents/section') && name.endsWith('.xml')
    )

    for (const fileName of sectionFiles.sort()) {
      const content = await zip.files[fileName].async('string')

      // XML에서 텍스트 추출 (간단한 정규식 사용)
      // <hp:t> 태그 내의 텍스트 추출
      const textMatches = content.match(/<hp:t[^>]*>([^<]*)<\/hp:t>/g) || []
      for (const match of textMatches) {
        const innerText = match.replace(/<[^>]*>/g, '')
        if (innerText.trim()) {
          text += innerText
        }
      }

      // 문단 구분
      const paragraphCount = (content.match(/<hp:p\b/g) || []).length
      if (paragraphCount > 0) {
        text += '\n'
      }
    }

    return {
      success: true,
      text: text.trim(),
      format: 'hwpx',
    }
  } catch (error) {
    console.error('HWPX 파싱 오류:', error)
    return {
      success: false,
      text: '',
      format: 'hwpx',
      error: error instanceof Error ? error.message : 'HWPX 파싱 실패',
    }
  }
}

/**
 * DOCX/XLSX/PPTX 파일에서 텍스트 추출 (officeparser 사용)
 */
async function parseOfficeDocument(
  buffer: Buffer,
  format: string
): Promise<DocumentParseResult> {
  try {
    const { OfficeParser } = await import('officeparser')

    // 임시 파일 경로 생성 (officeparser는 파일 경로 또는 Buffer 지원)
    const result = await OfficeParser.parseOffice(buffer)

    // AST에서 텍스트 추출
    let text = ''

    const extractTextFromAst = (node: unknown): void => {
      if (!node || typeof node !== 'object') return

      const obj = node as Record<string, unknown>

      // 텍스트 노드
      if (typeof obj.text === 'string') {
        text += obj.text + ' '
      }

      // children 처리
      if (Array.isArray(obj.children)) {
        for (const child of obj.children) {
          extractTextFromAst(child)
        }
      }

      // content 처리
      if (Array.isArray(obj.content)) {
        for (const item of obj.content) {
          extractTextFromAst(item)
        }
      }
    }

    if (result && typeof result === 'object') {
      extractTextFromAst(result)
    } else if (typeof result === 'string') {
      text = result
    }

    return {
      success: true,
      text: text.trim(),
      format,
    }
  } catch (error) {
    console.error(`${format.toUpperCase()} 파싱 오류:`, error)
    return {
      success: false,
      text: '',
      format,
      error: error instanceof Error ? error.message : `${format.toUpperCase()} 파싱 실패`,
    }
  }
}

/**
 * URL에서 파일 다운로드
 */
export async function downloadFile(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: '*/*',
      },
      // 리다이렉트 따라가기
      redirect: 'follow',
    })

    if (!response.ok) {
      console.error(`파일 다운로드 실패: ${response.status} - ${url}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error(`파일 다운로드 오류: ${url}`, error)
    return null
  }
}

/**
 * 버퍼에서 문서 텍스트 추출
 */
export async function parseDocument(
  buffer: Buffer,
  filename: string
): Promise<DocumentParseResult> {
  const ext = getFileExtension(filename)

  switch (ext) {
    case 'pdf':
      return parsePDF(buffer)

    case 'hwp':
      return parseHWP(buffer)

    case 'hwpx':
      return parseHWPX(buffer)

    case 'docx':
    case 'doc':
      return parseOfficeDocument(buffer, 'docx')

    case 'xlsx':
    case 'xls':
      return parseOfficeDocument(buffer, 'xlsx')

    case 'pptx':
    case 'ppt':
      return parseOfficeDocument(buffer, 'pptx')

    default:
      return {
        success: false,
        text: '',
        format: ext || 'unknown',
        error: `지원하지 않는 파일 형식: ${ext}`,
      }
  }
}

/**
 * URL에서 문서 다운로드 및 텍스트 추출
 */
export async function parseDocumentFromUrl(
  url: string
): Promise<DocumentParseResult> {
  const buffer = await downloadFile(url)

  if (!buffer) {
    return {
      success: false,
      text: '',
      format: 'unknown',
      error: '파일 다운로드 실패',
    }
  }

  return parseDocument(buffer, url)
}

/**
 * 여러 첨부파일에서 텍스트 추출 및 병합
 */
export async function parseMultipleDocuments(
  urls: string[]
): Promise<{
  success: boolean
  combinedText: string
  results: { url: string; result: DocumentParseResult }[]
}> {
  const results: { url: string; result: DocumentParseResult }[] = []
  let combinedText = ''
  let hasSuccess = false

  // 사업공고문, 지원서양식 등 중요 문서 우선 처리
  const priorityPatterns = [
    /사업공고/i,
    /공고문/i,
    /모집공고/i,
    /지원서/i,
    /신청서/i,
    /안내문/i,
    /사업안내/i,
  ]

  // URL 우선순위 정렬
  const sortedUrls = [...urls].sort((a, b) => {
    const aName = decodeURIComponent(a.split('/').pop() || '')
    const bName = decodeURIComponent(b.split('/').pop() || '')

    const aPriority = priorityPatterns.findIndex((p) => p.test(aName))
    const bPriority = priorityPatterns.findIndex((p) => p.test(bName))

    // 우선순위 높은 것 먼저 (패턴 매칭된 것이 앞으로)
    if (aPriority !== -1 && bPriority === -1) return -1
    if (aPriority === -1 && bPriority !== -1) return 1
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority

    return 0
  })

  // 순차적으로 처리 (Rate limit 고려)
  for (const url of sortedUrls) {
    try {
      const result = await parseDocumentFromUrl(url)
      results.push({ url, result })

      if (result.success && result.text) {
        hasSuccess = true

        // 파일명 추출
        const fileName = decodeURIComponent(url.split('/').pop() || '첨부파일')

        combinedText += `\n\n--- ${fileName} ---\n\n`
        combinedText += result.text
      }

      // Rate limiting: 요청 간 딜레이
      await new Promise((resolve) => setTimeout(resolve, 300))
    } catch (error) {
      console.error(`문서 파싱 오류: ${url}`, error)
      results.push({
        url,
        result: {
          success: false,
          text: '',
          format: 'unknown',
          error: error instanceof Error ? error.message : '파싱 오류',
        },
      })
    }
  }

  return {
    success: hasSuccess,
    combinedText: combinedText.trim(),
    results,
  }
}

/**
 * 텍스트 정리 및 요약 (토큰 제한 고려)
 */
export function cleanAndTruncateText(
  text: string,
  maxLength: number = 50000
): string {
  // 텍스트 정리
  let cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // 과도한 줄바꿈 제거
    .replace(/[ \t]+/g, ' ') // 과도한 공백 제거
    .replace(/\n +/g, '\n') // 줄 시작 공백 제거
    .trim()

  // 길이 제한
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength)
    // 문장 단위로 자르기
    const lastPeriod = cleaned.lastIndexOf('.')
    if (lastPeriod > maxLength * 0.8) {
      cleaned = cleaned.substring(0, lastPeriod + 1)
    }
    cleaned += '\n\n[... 이하 생략 ...]'
  }

  return cleaned
}

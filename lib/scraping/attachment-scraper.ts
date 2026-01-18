/**
 * 공고 상세페이지에서 첨부파일 URL을 추출하는 스크래퍼
 */

// 첨부파일 확장자 패턴
const ATTACHMENT_EXTENSIONS = /\.(pdf|hwp|hwpx|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|png|jpg|jpeg|gif)$/i

// HTML에서 텍스트 추출
function extractText(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

// URL 정규화
function normalizeUrl(url: string, baseUrl: string): string {
  if (!url) return ''

  // 이미 절대 URL인 경우
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // 상대 URL인 경우
  try {
    const base = new URL(baseUrl)
    if (url.startsWith('/')) {
      return `${base.protocol}//${base.host}${url}`
    }
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}

// 기업마당 상세페이지에서 첨부파일 추출
export async function scrapeBizinfoAttachments(detailUrl: string): Promise<string[]> {
  try {
    const response = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch bizinfo detail page: ${response.status}`)
      return []
    }

    const html = await response.text()
    const attachments: string[] = []

    // 첨부파일 영역 패턴 (기업마당 HTML 구조)
    // 일반적으로 <a> 태그에 파일 다운로드 링크가 있음
    const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
    let match

    while ((match = linkPattern.exec(html)) !== null) {
      const href = match[1]
      const text = match[2]

      // 첨부파일 패턴 확인
      if (
        ATTACHMENT_EXTENSIONS.test(href) ||
        href.includes('/download/') ||
        href.includes('fileDown') ||
        href.includes('atchFile') ||
        text.includes('첨부') ||
        text.includes('다운로드')
      ) {
        const fullUrl = normalizeUrl(href, 'https://www.bizinfo.go.kr')
        if (fullUrl && !attachments.includes(fullUrl)) {
          attachments.push(fullUrl)
        }
      }
    }

    return attachments
  } catch (error) {
    console.error('Bizinfo scraping error:', error)
    return []
  }
}

// 중소벤처24 상세페이지에서 첨부파일 추출
export async function scrapeSMESAttachments(detailUrl: string): Promise<string[]> {
  try {
    const response = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch SMES detail page: ${response.status}`)
      return []
    }

    const html = await response.text()
    const attachments: string[] = []

    // SMES 첨부파일 패턴
    const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
    let match

    while ((match = linkPattern.exec(html)) !== null) {
      const href = match[1]
      const text = match[2]

      if (
        ATTACHMENT_EXTENSIONS.test(href) ||
        href.includes('/cmm/fms/') ||
        href.includes('fileDown') ||
        href.includes('atchFile') ||
        text.includes('첨부') ||
        text.includes('다운로드')
      ) {
        const fullUrl = normalizeUrl(href, 'https://www.smes.go.kr')
        if (fullUrl && !attachments.includes(fullUrl)) {
          attachments.push(fullUrl)
        }
      }
    }

    return attachments
  } catch (error) {
    console.error('SMES scraping error:', error)
    return []
  }
}

// K-Startup 상세페이지에서 첨부파일 추출
export async function scrapeKStartupAttachments(detailUrl: string): Promise<string[]> {
  try {
    const response = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch K-Startup detail page: ${response.status}`)
      return []
    }

    const html = await response.text()
    const attachments: string[] = []

    const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
    let match

    while ((match = linkPattern.exec(html)) !== null) {
      const href = match[1]
      const text = match[2]

      if (
        ATTACHMENT_EXTENSIONS.test(href) ||
        href.includes('/download/') ||
        href.includes('fileDown') ||
        text.includes('첨부') ||
        text.includes('다운로드')
      ) {
        const fullUrl = normalizeUrl(href, 'https://www.k-startup.go.kr')
        if (fullUrl && !attachments.includes(fullUrl)) {
          attachments.push(fullUrl)
        }
      }
    }

    return attachments
  } catch (error) {
    console.error('K-Startup scraping error:', error)
    return []
  }
}

// 나라장터(G2B) 상세페이지에서 첨부파일 추출
export async function scrapeG2BAttachments(bidNtceNo: string, bidNtceOrd: string): Promise<string[]> {
  // G2B는 상세페이지 접근이 복잡하므로 API를 통해 처리
  // 실제 구현시에는 G2B 파일 다운로드 API 활용 필요
  return []
}

// 소스별 스크래퍼 선택
export async function scrapeAttachments(source: string, detailUrl: string): Promise<string[]> {
  switch (source) {
    case 'bizinfo':
      return scrapeBizinfoAttachments(detailUrl)
    case 'smes24':
      return scrapeSMESAttachments(detailUrl)
    case 'kstartup':
      return scrapeKStartupAttachments(detailUrl)
    default:
      return []
  }
}

// content에서 상세 URL 추출
export function extractDetailUrl(content: string, source: string): string | null {
  if (!content) return null

  // "상세보기: URL" 패턴 찾기
  const urlMatch = content.match(/상세보기:\s*(https?:\/\/[^\s]+)/i)
  if (urlMatch) {
    return urlMatch[1]
  }

  // URL 패턴 직접 찾기
  const patterns: Record<string, RegExp> = {
    bizinfo: /https?:\/\/www\.bizinfo\.go\.kr[^\s]*/i,
    smes24: /https?:\/\/www\.smes\.go\.kr[^\s]*/i,
    kstartup: /https?:\/\/www\.k-startup\.go\.kr[^\s]*/i,
  }

  const pattern = patterns[source]
  if (pattern) {
    const match = content.match(pattern)
    if (match) return match[0]
  }

  return null
}

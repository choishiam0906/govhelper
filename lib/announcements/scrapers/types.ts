/**
 * 지자체 스크래퍼 타입 정의
 */

export interface ScraperAnnouncement {
  source_id: string              // 원본 ID
  title: string                  // 공고 제목
  organization: string           // 지원 기관
  category?: string              // 분류
  support_type?: string          // 지원 유형
  target_company?: string        // 대상 기업
  support_amount?: string        // 지원 금액
  application_start?: string     // 접수 시작일 (YYYY-MM-DD)
  application_end?: string       // 접수 마감일 (YYYY-MM-DD)
  content?: string               // 공고 내용
  detail_url?: string            // 상세보기 URL
  attachment_urls?: string[]     // 첨부파일 URL 목록
}

export interface ScraperResult {
  announcements: ScraperAnnouncement[]
  total: number
  source: string
}

export interface ScraperOptions {
  limit?: number                 // 최대 수집 개수
  daysBack?: number              // 과거 N일 데이터 수집
}

/**
 * 지자체 스크래퍼 인터페이스
 */
export interface LocalScraper {
  id: string
  name: string
  scrape(options?: ScraperOptions): Promise<ScraperResult>
}

/**
 * 서울시 지원사업 스크래퍼
 *
 * 데이터 소스:
 * - 서울시 중소기업 지원사업 공고 페이지
 * - URL: https://seoulsolution.kr/ko/content/business-support (예시)
 *
 * TODO: 실제 API 또는 RSS 피드 URL로 교체 필요
 * - 서울시 공공데이터 포털: https://data.seoul.go.kr
 * - 서울시청 지원사업 페이지 HTML 스크래핑
 *
 * 현재 구현: 구조만 구축 (실제 엔드포인트는 추후 설정)
 */

import * as cheerio from 'cheerio'
import { ScraperResult, ScraperOptions, ScraperAnnouncement } from './types'

/**
 * 서울시 스크래퍼
 */
export class SeoulScraper {
  readonly id = 'seoul'
  readonly name = '서울특별시'

  // TODO: 실제 서울시 지원사업 API 또는 웹페이지 URL로 교체
  private readonly BASE_URL = 'https://www.seoul.go.kr/main/index.jsp'
  // 예시 엔드포인트 (실제로는 서울시 공공데이터 API 또는 RSS 피드)
  // private readonly API_URL = 'https://data.seoul.go.kr/api/support-programs'

  /**
   * 공고 스크래핑
   */
  async scrape(options?: ScraperOptions): Promise<ScraperResult> {
    const limit = options?.limit || 20
    const daysBack = options?.daysBack || 30

    try {
      // TODO: 실제 API 호출 또는 웹 스크래핑 로직 구현
      // 현재는 구조만 구축된 상태

      // 방법 1: 공공데이터 API 사용 (API 키 필요)
      // const apiKey = process.env.SEOUL_DATA_API_KEY
      // const response = await fetch(`${this.API_URL}?key=${apiKey}&limit=${limit}`)
      // const data = await response.json()
      // return this.parseApiResponse(data)

      // 방법 2: RSS 피드 파싱 (rss-parser 사용)
      // import Parser from 'rss-parser'
      // const parser = new Parser()
      // const feed = await parser.parseURL('서울시_RSS_URL')
      // return this.parseRssFeed(feed.items, limit)

      // 방법 3: HTML 스크래핑 (cheerio 사용)
      // return await this.scrapeWebPage(limit, daysBack)

      console.log('[서울시 스크래퍼] 실제 API/RSS 엔드포인트 설정 필요')

      // 임시: 빈 결과 반환
      return {
        announcements: [],
        total: 0,
        source: 'local_seoul',
      }

    } catch (error) {
      console.error('[서울시 스크래퍼] 오류:', error)
      return {
        announcements: [],
        total: 0,
        source: 'local_seoul',
      }
    }
  }

  /**
   * HTML 웹페이지 스크래핑 예시
   * TODO: 실제 서울시 지원사업 페이지 구조에 맞게 수정
   */
  private async scrapeWebPage(limit: number, daysBack: number): Promise<ScraperResult> {
    // TODO: 실제 서울시 지원사업 페이지 URL로 교체
    const targetUrl = `${this.BASE_URL}/support/programs`

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      const announcements: ScraperAnnouncement[] = []

      // TODO: 실제 HTML 구조에 맞게 셀렉터 수정
      // 예시 셀렉터 (실제 페이지 구조 확인 후 수정 필요)
      $('.announcement-list .item').each((index, element) => {
        if (index >= limit) return false // limit 도달 시 중단

        const $el = $(element)

        // 각 필드 추출 (셀렉터는 실제 HTML 구조에 맞게 수정)
        const title = $el.find('.title').text().trim()
        const organization = '서울특별시'
        const detailUrl = $el.find('a').attr('href') || ''
        const dateText = $el.find('.date').text().trim()

        // 날짜 파싱 (YYYY-MM-DD 형식으로 변환)
        const applicationEnd = this.parseDate(dateText)

        if (title && applicationEnd) {
          announcements.push({
            source_id: `SEOUL_${Date.now()}_${index}`,
            title,
            organization,
            category: '지자체',
            support_type: '서울시',
            detail_url: detailUrl.startsWith('http') ? detailUrl : `${this.BASE_URL}${detailUrl}`,
            application_end: applicationEnd,
          })
        }
      })

      return {
        announcements,
        total: announcements.length,
        source: 'local_seoul',
      }

    } catch (error) {
      console.error('[서울시 웹 스크래핑] 오류:', error)
      return {
        announcements: [],
        total: 0,
        source: 'local_seoul',
      }
    }
  }

  /**
   * 날짜 문자열을 YYYY-MM-DD 형식으로 변환
   */
  private parseDate(dateStr: string): string | undefined {
    if (!dateStr) return undefined

    // "2026-01-28" 형식
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }

    // "2026.01.28" 형식
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateStr)) {
      return dateStr.replace(/\./g, '-')
    }

    // "20260128" 형식
    if (/^\d{8}$/.test(dateStr)) {
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
    }

    return undefined
  }

  /**
   * API 응답 파싱 예시
   * TODO: 실제 서울시 API 응답 구조에 맞게 수정
   */
  private parseApiResponse(data: any): ScraperResult {
    const announcements: ScraperAnnouncement[] = []

    // TODO: 실제 API 응답 구조에 맞게 수정
    const items = data.items || data.result || []

    for (const item of items) {
      announcements.push({
        source_id: item.id || item.noticeId || `SEOUL_${Date.now()}`,
        title: item.title || item.noticeName,
        organization: item.organization || '서울특별시',
        category: '지자체',
        support_type: '서울시',
        support_amount: item.supportAmount,
        application_start: item.startDate,
        application_end: item.endDate,
        content: item.content || item.description,
        detail_url: item.url || item.detailUrl,
      })
    }

    return {
      announcements,
      total: announcements.length,
      source: 'local_seoul',
    }
  }
}

/**
 * 서울시 스크래퍼 싱글톤 인스턴스
 */
export const seoulScraper = new SeoulScraper()

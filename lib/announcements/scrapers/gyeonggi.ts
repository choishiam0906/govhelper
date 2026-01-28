/**
 * 경기도 지원사업 스크래퍼
 *
 * 데이터 소스:
 * - 경기도 중소기업 지원사업 공고 페이지
 * - URL: https://www.gg.go.kr (예시)
 *
 * TODO: 실제 API 또는 RSS 피드 URL로 교체 필요
 * - 경기도 공공데이터 포털: https://data.gg.go.kr
 * - 경기도청 지원사업 페이지 HTML 스크래핑
 *
 * 현재 구현: 구조만 구축 (실제 엔드포인트는 추후 설정)
 */

import * as cheerio from 'cheerio'
import { ScraperResult, ScraperOptions, ScraperAnnouncement } from './types'

/**
 * 경기도 스크래퍼
 */
export class GyeonggiScraper {
  readonly id = 'gyeonggi'
  readonly name = '경기도'

  // TODO: 실제 경기도 지원사업 API 또는 웹페이지 URL로 교체
  private readonly BASE_URL = 'https://www.gg.go.kr'
  // 예시 엔드포인트 (실제로는 경기도 공공데이터 API 또는 RSS 피드)
  // private readonly API_URL = 'https://data.gg.go.kr/api/support-programs'

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
      // const apiKey = process.env.GYEONGGI_DATA_API_KEY
      // const response = await fetch(`${this.API_URL}?key=${apiKey}&limit=${limit}`)
      // const data = await response.json()
      // return this.parseApiResponse(data)

      // 방법 2: RSS 피드 파싱 (rss-parser 사용)
      // import Parser from 'rss-parser'
      // const parser = new Parser()
      // const feed = await parser.parseURL('경기도_RSS_URL')
      // return this.parseRssFeed(feed.items, limit)

      // 방법 3: HTML 스크래핑 (cheerio 사용)
      // return await this.scrapeWebPage(limit, daysBack)

      console.log('[경기도 스크래퍼] 실제 API/RSS 엔드포인트 설정 필요')

      // 임시: 빈 결과 반환
      return {
        announcements: [],
        total: 0,
        source: 'local_gyeonggi',
      }

    } catch (error) {
      console.error('[경기도 스크래퍼] 오류:', error)
      return {
        announcements: [],
        total: 0,
        source: 'local_gyeonggi',
      }
    }
  }

  /**
   * HTML 웹페이지 스크래핑 예시
   * TODO: 실제 경기도 지원사업 페이지 구조에 맞게 수정
   */
  private async scrapeWebPage(limit: number, daysBack: number): Promise<ScraperResult> {
    // TODO: 실제 경기도 지원사업 페이지 URL로 교체
    const targetUrl = `${this.BASE_URL}/support/business`

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
      $('.business-list .item').each((index, element) => {
        if (index >= limit) return false // limit 도달 시 중단

        const $el = $(element)

        // 각 필드 추출 (셀렉터는 실제 HTML 구조에 맞게 수정)
        const title = $el.find('.title').text().trim()
        const organization = '경기도'
        const detailUrl = $el.find('a').attr('href') || ''
        const supportAmount = $el.find('.amount').text().trim()
        const dateText = $el.find('.deadline').text().trim()

        // 날짜 파싱 (YYYY-MM-DD 형식으로 변환)
        const applicationEnd = this.parseDate(dateText)

        if (title && applicationEnd) {
          announcements.push({
            source_id: `GYEONGGI_${Date.now()}_${index}`,
            title,
            organization,
            category: '지자체',
            support_type: '경기도',
            support_amount: supportAmount || undefined,
            detail_url: detailUrl.startsWith('http') ? detailUrl : `${this.BASE_URL}${detailUrl}`,
            application_end: applicationEnd,
          })
        }
      })

      return {
        announcements,
        total: announcements.length,
        source: 'local_gyeonggi',
      }

    } catch (error) {
      console.error('[경기도 웹 스크래핑] 오류:', error)
      return {
        announcements: [],
        total: 0,
        source: 'local_gyeonggi',
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

    // "~ YYYY.MM.DD" 형식 (마감일만 추출)
    const match = dateStr.match(/~\s*(\d{4})[.\-\/](\d{2})[.\-\/](\d{2})/)
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`
    }

    return undefined
  }

  /**
   * API 응답 파싱 예시
   * TODO: 실제 경기도 API 응답 구조에 맞게 수정
   */
  private parseApiResponse(data: any): ScraperResult {
    const announcements: ScraperAnnouncement[] = []

    // TODO: 실제 API 응답 구조에 맞게 수정
    const items = data.data || data.list || []

    for (const item of items) {
      announcements.push({
        source_id: item.biz_id || item.noticeNo || `GYEONGGI_${Date.now()}`,
        title: item.biz_name || item.title,
        organization: item.dept_name || '경기도',
        category: '지자체',
        support_type: '경기도',
        support_amount: item.support_scale,
        application_start: item.apply_start_dt,
        application_end: item.apply_end_dt,
        content: item.biz_summary || item.content,
        detail_url: item.url || item.link,
        target_company: item.target,
      })
    }

    return {
      announcements,
      total: announcements.length,
      source: 'local_gyeonggi',
    }
  }

  /**
   * RSS 피드 파싱 예시
   * TODO: rss-parser 설치 후 사용
   */
  // private parseRssFeed(items: any[], limit: number): ScraperResult {
  //   const announcements: ScraperAnnouncement[] = []
  //
  //   for (let i = 0; i < Math.min(items.length, limit); i++) {
  //     const item = items[i]
  //     announcements.push({
  //       source_id: item.guid || `GYEONGGI_RSS_${i}`,
  //       title: item.title,
  //       organization: '경기도',
  //       category: '지자체',
  //       support_type: '경기도',
  //       content: item.contentSnippet || item.content,
  //       detail_url: item.link,
  //       application_end: this.parseDate(item.pubDate),
  //     })
  //   }
  //
  //   return {
  //     announcements,
  //     total: announcements.length,
  //     source: 'local_gyeonggi',
  //   }
  // }
}

/**
 * 경기도 스크래퍼 싱글톤 인스턴스
 */
export const gyeonggiScraper = new GyeonggiScraper()

/**
 * 지자체 스크래퍼 레지스트리
 *
 * 각 지자체 스크래퍼를 통합 관리하고, ID로 조회할 수 있도록 제공
 */

import { seoulScraper } from './seoul'
import { gyeonggiScraper } from './gyeonggi'
import { busanScraper } from './busan'
import { incheonScraper } from './incheon'
import { daeguScraper } from './daegu'
import { gwangjuScraper } from './gwangju'
import { daejeonScraper } from './daejeon'
import { ScraperResult, ScraperOptions } from './types'

export * from './types'

/**
 * 지자체 스크래퍼 인터페이스
 */
export interface LocalScraper {
  readonly id: string
  readonly name: string
  scrape(options?: ScraperOptions): Promise<ScraperResult>
}

/**
 * 등록된 모든 스크래퍼 목록
 */
export const scrapers: Record<string, LocalScraper> = {
  seoul: seoulScraper,
  gyeonggi: gyeonggiScraper,
  busan: busanScraper,
  incheon: incheonScraper,
  daegu: daeguScraper,
  gwangju: gwangjuScraper,
  daejeon: daejeonScraper,
  // 향후 추가될 지자체 스크래퍼
  // ulsan: ulsanScraper,
  // sejong: sejongScraper,
  // ...
}

/**
 * ID로 스크래퍼 조회
 */
export function getScraperById(id: string): LocalScraper | undefined {
  return scrapers[id]
}

/**
 * 모든 스크래퍼 조회
 */
export function getAllScrapers(): LocalScraper[] {
  return Object.values(scrapers)
}

/**
 * 스크래퍼 ID 목록
 */
export function getScraperIds(): string[] {
  return Object.keys(scrapers)
}

/**
 * 특정 지자체 공고 수집
 */
export async function scrapeLocalAnnouncements(
  localId: string,
  options?: ScraperOptions
): Promise<ScraperResult> {
  const scraper = getScraperById(localId)

  if (!scraper) {
    throw new Error(`스크래퍼를 찾을 수 없어요: ${localId}`)
  }

  return await scraper.scrape(options)
}

// DART (전자공시시스템) 기업정보 조회 소스

import type { DARTResult, StockMarketType } from '../types'
import { createClient } from '@/lib/supabase/client'

// DART 데이터 테이블 타입
interface DARTCompanyRecord {
  id: number
  corp_code: string
  corp_name: string
  corp_name_eng: string | null
  stock_code: string | null
  stock_market: string | null
  ceo_name: string | null
  corp_address: string | null
  homepage: string | null
  phone_number: string | null
  fax_number: string | null
  industry_code: string | null
  established_date: string | null
  accounting_month: string | null
  created_at: string
  updated_at: string
}

// 상장 구분 변환
function mapStockMarket(market: string | null): StockMarketType {
  if (!market) return ''

  const marketMap: Record<string, StockMarketType> = {
    Y: '유가증권시장',
    K: '코스닥',
    N: '코넥스',
  }
  return marketMap[market] || '비상장'
}

// 회사명으로 DART 정보 조회 (정확 일치)
export async function lookupFromDARTByName(
  companyName: string
): Promise<DARTResult | null> {
  try {
    const supabase = createClient()

    // 회사명 정규화 (공백, 특수문자 처리)
    const normalizedName = companyName.trim()

    const { data, error } = await supabase
      .from('dart_companies')
      .select('*')
      .eq('corp_name', normalizedName)
      .single()

    if (error || !data) {
      // 정확 일치 없으면 null 반환
      if (error?.code === 'PGRST116') {
        return null
      }
      console.error('DART lookup error:', error)
      return null
    }

    return mapDARTRecord(data as DARTCompanyRecord)
  } catch (error) {
    console.error('DART lookup error:', error)
    return null
  }
}

// 회사명으로 DART 정보 검색 (유사 검색)
export async function searchDARTByCompanyName(
  companyName: string,
  limit: number = 10
): Promise<DARTResult[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('dart_companies')
      .select('*')
      .ilike('corp_name', `%${companyName}%`)
      .limit(limit)

    if (error || !data) {
      console.error('DART search error:', error)
      return []
    }

    return (data as DARTCompanyRecord[]).map(mapDARTRecord)
  } catch (error) {
    console.error('DART search error:', error)
    return []
  }
}

// corp_code로 DART 정보 조회
export async function lookupFromDARTByCorpCode(
  corpCode: string
): Promise<DARTResult | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('dart_companies')
      .select('*')
      .eq('corp_code', corpCode)
      .single()

    if (error || !data) {
      if (error?.code === 'PGRST116') {
        return null
      }
      console.error('DART lookup error:', error)
      return null
    }

    return mapDARTRecord(data as DARTCompanyRecord)
  } catch (error) {
    console.error('DART lookup error:', error)
    return null
  }
}

// 상장 기업만 검색
export async function searchDARTListedCompanies(
  keyword: string,
  limit: number = 20
): Promise<DARTResult[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('dart_companies')
      .select('*')
      .ilike('corp_name', `%${keyword}%`)
      .not('stock_code', 'is', null)
      .limit(limit)

    if (error || !data) {
      console.error('DART listed search error:', error)
      return []
    }

    return (data as DARTCompanyRecord[]).map(mapDARTRecord)
  } catch (error) {
    console.error('DART listed search error:', error)
    return []
  }
}

// 상장 시장별 기업 수 통계
export async function getDARTStatsByMarket(): Promise<
  Record<string, number>
> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('dart_companies')
      .select('stock_market')

    if (error || !data) {
      console.error('DART stats error:', error)
      return {}
    }

    const stats: Record<string, number> = {
      유가증권시장: 0,
      코스닥: 0,
      코넥스: 0,
      비상장: 0,
    }

    for (const record of data) {
      const market = mapStockMarket((record as { stock_market: string | null }).stock_market)
      if (market) {
        stats[market] = (stats[market] || 0) + 1
      } else {
        stats['비상장'] = (stats['비상장'] || 0) + 1
      }
    }

    return stats
  } catch (error) {
    console.error('DART stats error:', error)
    return {}
  }
}

// 레코드 → 결과 타입 변환 헬퍼
function mapDARTRecord(record: DARTCompanyRecord): DARTResult {
  return {
    source: 'dart',
    corpCode: record.corp_code,
    corpName: record.corp_name,
    corpNameEng: record.corp_name_eng,
    stockCode: record.stock_code,
    stockMarket: mapStockMarket(record.stock_market),
    ceoName: record.ceo_name,
    address: record.corp_address,
    homepage: record.homepage,
    phone: record.phone_number,
    fax: record.fax_number,
    industryCode: record.industry_code,
    establishedDate: record.established_date,
    accountingMonth: record.accounting_month,
  }
}

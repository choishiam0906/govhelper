// 국민연금 사업장 정보 조회 소스

import type { NPSResult } from '../types'
import { createClient } from '@/lib/supabase/client'

// 국민연금 데이터 테이블 타입
interface NPSCompanyRecord {
  id: number
  business_number: string
  company_name: string
  address: string
  location: string
  employee_count: number
  created_at: string
  updated_at: string
}

// 사업자번호로 국민연금 정보 조회
export async function lookupFromNPS(
  businessNumber: string
): Promise<NPSResult | null> {
  try {
    const supabase = createClient()

    // 사업자번호 포맷 통일 (하이픈 제거)
    const formatted = businessNumber.replace(/[^0-9]/g, '')

    if (formatted.length !== 10) {
      return null
    }

    const { data, error } = await supabase
      .from('nps_business_registry')
      .select('*')
      .eq('business_number', formatted)
      .single()

    if (error || !data) {
      // 데이터가 없는 경우 null 반환 (에러가 아님)
      if (error?.code === 'PGRST116') {
        return null
      }
      console.error('NPS lookup error:', error)
      return null
    }

    const record = data as NPSCompanyRecord

    return {
      source: 'nps',
      businessNumber: record.business_number,
      companyName: record.company_name,
      address: record.address,
      location: record.location,
      employeeCount: record.employee_count,
    }
  } catch (error) {
    console.error('NPS lookup error:', error)
    return null
  }
}

// 회사명으로 국민연금 정보 검색 (유사 검색)
export async function searchNPSByCompanyName(
  companyName: string,
  limit: number = 10
): Promise<NPSResult[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('nps_business_registry')
      .select('*')
      .ilike('company_name', `%${companyName}%`)
      .limit(limit)

    if (error || !data) {
      console.error('NPS search error:', error)
      return []
    }

    return (data as NPSCompanyRecord[]).map((record) => ({
      source: 'nps' as const,
      businessNumber: record.business_number,
      companyName: record.company_name,
      address: record.address,
      location: record.location,
      employeeCount: record.employee_count,
    }))
  } catch (error) {
    console.error('NPS search error:', error)
    return []
  }
}

// 지역별 국민연금 기업 통계
export async function getNPSStatsByLocation(): Promise<
  Record<string, number>
> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('nps_business_registry')
      .select('location')

    if (error || !data) {
      console.error('NPS stats error:', error)
      return {}
    }

    const stats: Record<string, number> = {}
    for (const record of data) {
      const location = (record as { location: string }).location || '기타'
      stats[location] = (stats[location] || 0) + 1
    }

    return stats
  } catch (error) {
    console.error('NPS stats error:', error)
    return {}
  }
}

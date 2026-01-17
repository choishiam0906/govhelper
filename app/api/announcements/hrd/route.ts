import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DB 공고 타입
interface Announcement {
  id: string
  source: string
  source_id: string
  title: string
  organization: string
  category: string
  support_type: string
  target_company: string
  support_amount: string
  application_start: string
  application_end: string
  content: string
  status: string
  created_at: string
  updated_at: string
}

// HRD Korea 훈련과정 조회 API
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const keyword = searchParams.get('keyword') || ''
    const category = searchParams.get('category') || ''
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const offset = (page - 1) * limit

    // 쿼리 빌드
    let query = supabase
      .from('announcements')
      .select('*', { count: 'exact' })
      .eq('source', 'hrd')
      .order('application_end', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1)

    // 진행중 공고만
    if (activeOnly) {
      query = query.eq('status', 'active')
    }

    // 키워드 검색
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,organization.ilike.%${keyword}%,content.ilike.%${keyword}%`)
    }

    // 카테고리 필터
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // 응답 형식 변환
    const trainings = ((data || []) as Announcement[]).map(item => ({
      id: item.id,
      title: item.title,
      organization: item.organization,
      category: item.category,
      supportType: item.support_type,
      targetCompany: item.target_company,
      supportAmount: item.support_amount,
      startDate: item.application_start,
      endDate: item.application_end,
      content: item.content,
      detailUrl: item.content?.split('\n').find((line: string) => line.startsWith('http')) || '',
      status: item.status,
      source: item.source,
    }))

    return NextResponse.json({
      success: true,
      data: trainings,
      meta: {
        total: count || 0,
        page,
        limit,
        fetchedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('HRD 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '훈련과정 조회 중 오류가 발생했어요.' },
      { status: 500 }
    )
  }
}

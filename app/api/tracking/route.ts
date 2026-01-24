import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 지원 상태 타입
type ApplicationStatus =
  | 'interested'
  | 'preparing'
  | 'submitted'
  | 'under_review'
  | 'passed_initial'
  | 'passed_final'
  | 'rejected'
  | 'cancelled'

// 지원 이력 타입
interface TrackingRecord {
  id: string
  user_id: string
  company_id: string
  announcement_id: string
  status: ApplicationStatus
  status_updated_at: string
  application_id: string | null
  submitted_at: string | null
  result_announced_at: string | null
  result_note: string | null
  memo: string | null
  notify_deadline: boolean
  notify_result: boolean
  created_at: string
  updated_at: string
  announcements?: {
    id: string
    title: string
    organization: string
    application_start: string | null
    application_end: string | null
    support_amount: string | null
  }
}

// GET: 지원 이력 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('application_tracking')
      .select(`
        *,
        announcements (
          id,
          title,
          organization,
          application_start,
          application_end,
          support_amount
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data as TrackingRecord[],
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    })
  } catch (error) {
    console.error('Tracking GET error:', error)
    return NextResponse.json(
      { error: '지원 이력 조회 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

// POST: 새로운 지원 이력 추가
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
    }

    const body = await request.json()
    const { announcement_id, status = 'interested', memo } = body

    if (!announcement_id) {
      return NextResponse.json(
        { error: '공고 ID가 필요해요' },
        { status: 400 }
      )
    }

    // 기업 정보 조회
    const { data: companyData } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const company = companyData as { id: string } | null

    if (!company) {
      return NextResponse.json(
        { error: '기업 정보가 필요해요' },
        { status: 400 }
      )
    }

    // 이미 추적 중인지 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('application_tracking')
      .select('id')
      .eq('user_id', user.id)
      .eq('announcement_id', announcement_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: '이미 추적 중인 공고예요', tracking_id: existing.id },
        { status: 409 }
      )
    }

    // 추적 레코드 생성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('application_tracking')
      .insert({
        user_id: user.id,
        company_id: company.id,
        announcement_id,
        status,
        memo,
      })
      .select(`
        *,
        announcements (
          id,
          title,
          organization,
          application_start,
          application_end,
          support_amount
        )
      `)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: '지원 이력에 추가했어요',
    })
  } catch (error) {
    console.error('Tracking POST error:', error)
    return NextResponse.json(
      { error: '지원 이력 추가 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

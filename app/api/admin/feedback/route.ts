import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 관리자 이메일 목록
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'choishiam@gmail.com').split(',')

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: '관리자 권한이 필요해요' }, { status: 403 })
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 피드백 조회
    let query = supabase
      .from('feedbacks')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (type !== 'all') {
      query = query.eq('type', type)
    }

    const { data: feedbacks, count, error } = await query

    if (error) {
      console.error('Feedback fetch error:', error)
      return NextResponse.json({ error: '피드백 조회에 실패했어요' }, { status: 500 })
    }

    return NextResponse.json({
      feedbacks,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Admin feedback API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했어요' }, { status: 500 })
  }
}

// 피드백 상태 업데이트
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 인증 확인
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요해요' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: '관리자 권한이 필요해요' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, adminNotes } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'ID와 상태가 필요해요' }, { status: 400 })
    }

    const updateData: Record<string, any> = {
      status,
      admin_notes: adminNotes || null,
    }

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = user.id
    }

    const { error } = await supabase
      .from('feedbacks')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Feedback update error:', error)
      return NextResponse.json({ error: '상태 업데이트에 실패했어요' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin feedback PATCH error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했어요' }, { status: 500 })
  }
}

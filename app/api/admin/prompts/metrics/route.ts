/**
 * 관리자용 프롬프트 메트릭 조회 API
 *
 * GET: 프롬프트 성능 메트릭 조회
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/prompts/metrics
 * 프롬프트 성능 메트릭 조회
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 })
    }

    // 관리자 이메일 확인
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    // 메트릭 뷰 조회 (테이블 미생성 시 타입 오류 방지)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: metrics, error } = await (supabase as any)
      .from('prompt_metrics')
      .select('*')
      .order('total_usage', { ascending: false })

    if (error) {
      console.error('메트릭 조회 실패:', error)
      return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('메트릭 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

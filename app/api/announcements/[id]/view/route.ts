import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 공고 조회 기록 (fire-and-forget)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: true }) // 비로그인도 200 반환 (조용히 무시)
    }

    // upsert: 이미 있으면 view_count 증가
    // user_announcement_views 테이블은 마이그레이션으로 추가되므로 타입 캐스팅 필요
    const { error } = await (supabase as any)
      .from('user_announcement_views')
      .upsert(
        {
          user_id: user.id,
          announcement_id: id,
          view_count: 1,
          last_viewed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,announcement_id',
        }
      )

    // view_count 증가는 별도 RPC로 처리
    if (!error) {
      try {
        await (supabase as any).rpc('increment_view_count', {
          p_user_id: user.id,
          p_announcement_id: id,
        })
      } catch {
        // 실패해도 무시
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true }) // 에러도 200 (fire-and-forget)
  }
}

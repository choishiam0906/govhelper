import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')

  if (!email) {
    return new NextResponse('이메일이 필요해요.', { status: 400 })
  }

  try {
    const supabase = await createServiceClient()

    // guest_leads에서 해당 이메일의 모든 매칭을 email_sent로 마킹
    const { data: leads } = await supabase
      .from('guest_leads')
      .select('id')
      .eq('email', email)

    if (leads && leads.length > 0) {
      const leadIds = leads.map(l => l.id)
      await supabase
        .from('guest_matches')
        .update({ email_sent: true, email_sent_at: new Date().toISOString() })
        .in('lead_id', leadIds)
    }

    // 수신거부 완료 HTML 페이지 반환
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>수신 거부 완료</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:40px;">
        <h2>수신 거부가 완료됐어요</h2>
        <p>더 이상 재타겟팅 이메일을 받지 않아요.</p>
        <p><a href="https://govhelpers.com">GovHelper 홈으로</a></p>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error) {
    console.error('수신 거부 처리 오류:', error)
    return new NextResponse('오류가 발생했어요.', { status: 500 })
  }
}

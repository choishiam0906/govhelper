import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // 비밀번호 재설정의 경우 reset-password 페이지로 리다이렉트
      if (type === 'recovery' || next === '/reset-password') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 에러 발생 시 적절한 페이지로 리다이렉트
  if (next === '/reset-password') {
    return NextResponse.redirect(`${origin}/forgot-password?error=Link expired or invalid`)
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}

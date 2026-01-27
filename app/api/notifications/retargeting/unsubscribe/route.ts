/**
 * 비회원 재타겟팅 이메일 수신 거부 API
 *
 * 이메일 수신을 원하지 않는 리드의 converted_to_user를 true로 설정하여 재타겟팅 대상에서 제외
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin 클라이언트 (RLS 우회)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>오류 - GovHelper</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; }
          .error { color: #ef4444; font-size: 18px; }
        </style>
      </head>
      <body>
        <h1>오류</h1>
        <p class="error">이메일 주소가 제공되지 않았어요.</p>
      </body>
      </html>
      `,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  try {
    // 해당 이메일의 리드 조회
    const { data: lead, error: selectError } = await supabaseAdmin
      .from('guest_leads')
      .select('id, email')
      .eq('email', email)
      .single()

    if (selectError || !lead) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>오류 - GovHelper</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; }
            .error { color: #ef4444; font-size: 18px; }
          </style>
        </head>
        <body>
          <h1>오류</h1>
          <p class="error">해당 이메일을 찾을 수 없어요.</p>
        </body>
        </html>
        `,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      )
    }

    // converted_to_user를 true로 설정하여 재타겟팅 대상에서 제외
    const { error: updateError } = await supabaseAdmin
      .from('guest_leads')
      .update({
        converted_to_user: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id)

    if (updateError) {
      console.error('[Retargeting Unsubscribe] Failed to update lead:', updateError)
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>오류 - GovHelper</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; }
            .error { color: #ef4444; font-size: 18px; }
          </style>
        </head>
        <body>
          <h1>오류</h1>
          <p class="error">수신 거부 처리 중 오류가 발생했어요.</p>
        </body>
        </html>
        `,
        {
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      )
    }

    // 성공 페이지 반환
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>수신 거부 완료 - GovHelper</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            text-align: center;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          h1 { color: #1f2937; font-size: 24px; margin-bottom: 16px; }
          p { color: #6b7280; font-size: 16px; line-height: 1.6; }
          .success { color: #16a34a; font-weight: 600; }
          a { color: #2563eb; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>수신 거부 완료</h1>
          <p class="success">재타겟팅 이메일 수신이 거부됐어요.</p>
          <p>${email}로 더 이상 알림 이메일을 보내지 않을게요.</p>
          <p style="margin-top: 32px;">
            <a href="https://govhelpers.com">GovHelper 홈페이지로 이동</a>
          </p>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  } catch (error) {
    console.error('[Retargeting Unsubscribe] Unexpected error:', error)
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>오류 - GovHelper</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; text-align: center; }
          .error { color: #ef4444; font-size: 18px; }
        </style>
      </head>
      <body>
        <h1>오류</h1>
        <p class="error">예상치 못한 오류가 발생했어요.</p>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }
}

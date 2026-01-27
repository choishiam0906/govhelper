/**
 * 관리자용 프롬프트 버전 관리 API
 *
 * GET: 프롬프트 목록 조회
 * POST: 새 버전 생성
 * PUT: 버전 활성화/비활성화
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PromptType } from '@/lib/ai/prompts/versions'

/**
 * GET /api/admin/prompts
 * 프롬프트 목록 조회
 */
export async function GET(request: NextRequest) {
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

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url)
    const promptType = searchParams.get('type') as PromptType | null
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // 프롬프트 버전 조회 (테이블 미생성 시 타입 오류 방지)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('prompt_versions')
      .select('*')
      .order('prompt_type', { ascending: true })
      .order('version', { ascending: false })

    if (promptType) {
      query = query.eq('prompt_type', promptType)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: versions, error } = await query

    if (error) {
      console.error('프롬프트 조회 실패:', error)
      return NextResponse.json({ error: '조회 실패' }, { status: 500 })
    }

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('프롬프트 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

/**
 * POST /api/admin/prompts
 * 새 프롬프트 버전 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { promptType, version, content, description, isActive = true, weight = 50 } = body

    // 유효성 검사
    if (!promptType || !version || !content) {
      return NextResponse.json(
        { error: 'promptType, version, content 필수' },
        { status: 400 }
      )
    }

    // 버전 생성 (테이블 미생성 시 타입 오류 방지)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newVersion, error } = await (supabase as any)
      .from('prompt_versions')
      .insert({
        prompt_type: promptType,
        version,
        content,
        description,
        is_active: isActive,
        weight,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('프롬프트 생성 실패:', error)
      return NextResponse.json(
        { error: '생성 실패 (중복 버전일 수 있음)' },
        { status: 400 }
      )
    }

    return NextResponse.json({ version: newVersion }, { status: 201 })
  } catch (error) {
    console.error('프롬프트 생성 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/prompts
 * 프롬프트 버전 수정 (활성화/비활성화, 가중치 변경)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    // 요청 본문 파싱
    const body = await request.json()
    const { id, isActive, weight, content, description } = body

    if (!id) {
      return NextResponse.json({ error: 'id 필수' }, { status: 400 })
    }

    // 업데이트 필드 구성
    const updates: any = {}
    if (typeof isActive === 'boolean') updates.is_active = isActive
    if (typeof weight === 'number') updates.weight = weight
    if (content) updates.content = content
    if (description) updates.description = description

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 필드가 없음' },
        { status: 400 }
      )
    }

    // 버전 업데이트 (테이블 미생성 시 타입 오류 방지)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedVersion, error } = await (supabase as any)
      .from('prompt_versions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('프롬프트 업데이트 실패:', error)
      return NextResponse.json({ error: '업데이트 실패' }, { status: 500 })
    }

    return NextResponse.json({ version: updatedVersion })
  } catch (error) {
    console.error('프롬프트 업데이트 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

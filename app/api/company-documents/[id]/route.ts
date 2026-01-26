import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteCompanyDocument, processCompanyDocument } from '@/lib/company-documents'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET: 문서 상세 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요해요' },
        { status: 401 }
      )
    }

    // 문서 조회 (RLS가 적용되어 본인 문서만 조회됨)
    const { data: document, error } = await supabase
      .from('company_documents')
      .select(`
        *,
        chunks:company_document_chunks(count)
      `)
      .eq('id', id)
      .single()

    if (error || !document) {
      return NextResponse.json(
        { success: false, error: '문서를 찾을 수 없어요' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      document,
    })
  } catch (error) {
    console.error('문서 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

/**
 * POST: 문서 재처리 (임베딩 재생성)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요해요' },
        { status: 401 }
      )
    }

    // 문서 소유권 확인
    const { data: document } = await supabase
      .from('company_documents')
      .select('id')
      .eq('id', id)
      .single()

    if (!document) {
      return NextResponse.json(
        { success: false, error: '문서를 찾을 수 없어요' },
        { status: 404 }
      )
    }

    // 문서 재처리
    const result = await processCompanyDocument(supabase, id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      chunksCreated: result.chunksCreated,
      message: '문서 처리가 완료되었어요',
    })
  } catch (error) {
    console.error('문서 재처리 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: 문서 삭제
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요해요' },
        { status: 401 }
      )
    }

    // 문서 삭제 (RLS가 적용되어 본인 문서만 삭제 가능)
    const result = await deleteCompanyDocument(supabase, id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '문서가 삭제되었어요',
    })
  } catch (error) {
    console.error('문서 삭제 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

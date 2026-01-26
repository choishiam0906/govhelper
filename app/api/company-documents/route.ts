import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  uploadCompanyDocument,
  processCompanyDocument,
  getCompanyDocuments,
} from '@/lib/company-documents'

/**
 * GET: 회사의 문서 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요해요' },
        { status: 401 }
      )
    }

    // 사용자의 회사 조회
    const { data: companyResult } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const company = companyResult as { id: string } | null

    if (!company?.id) {
      return NextResponse.json(
        { success: false, error: '기업 정보가 없어요' },
        { status: 404 }
      )
    }

    const documents = await getCompanyDocuments(supabase, company.id)

    return NextResponse.json({
      success: true,
      documents,
    })
  } catch (error) {
    console.error('문서 목록 조회 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

/**
 * POST: 문서 업로드 및 처리
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요해요' },
        { status: 401 }
      )
    }

    // 사용자의 회사 조회
    const { data: companyResult2 } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const company = companyResult2 as { id: string } | null

    if (!company?.id) {
      return NextResponse.json(
        { success: false, error: '기업 정보가 없어요' },
        { status: 404 }
      )
    }

    // FormData에서 파일 추출
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentType = (formData.get('documentType') as string) || 'business_plan'

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없어요' },
        { status: 400 }
      )
    }

    // PDF 파일 검증
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'PDF 파일만 업로드 가능해요' },
        { status: 400 }
      )
    }

    // 문서 업로드
    const uploadResult = await uploadCompanyDocument(
      supabase,
      company.id,
      file,
      documentType
    )

    if (!uploadResult.success || !uploadResult.documentId) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 400 }
      )
    }

    // 문서 처리 (텍스트 추출 + 임베딩)
    const processResult = await processCompanyDocument(supabase, uploadResult.documentId)

    if (!processResult.success) {
      return NextResponse.json(
        {
          success: false,
          documentId: uploadResult.documentId,
          error: processResult.error,
          status: 'failed',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      documentId: uploadResult.documentId,
      chunksCreated: processResult.chunksCreated,
      message: '사업계획서가 성공적으로 업로드되었어요',
    })
  } catch (error) {
    console.error('문서 업로드 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

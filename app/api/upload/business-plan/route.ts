import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다' },
        { status: 400 }
      )
    }

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'PDF 파일만 업로드할 수 있어요' },
        { status: 400 }
      )
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: '파일 크기는 10MB 이하여야 해요' },
        { status: 400 }
      )
    }

    // 파일명 생성 (user_id + timestamp)
    const timestamp = Date.now()
    const fileName = `${user.id}/${timestamp}_business_plan.pdf`

    // ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('business-plans')
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json(
        { success: false, error: '파일 업로드에 실패했어요' },
        { status: 500 }
      )
    }

    // 파일 경로 반환 (비공개 버킷이므로 경로만 저장)
    return NextResponse.json({
      success: true,
      data: {
        path: data.path,
        url: data.path, // 경로를 저장하고, 조회 시 서명된 URL 생성
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

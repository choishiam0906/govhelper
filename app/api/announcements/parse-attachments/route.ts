import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  parseMultipleDocuments,
  cleanAndTruncateText,
} from '@/lib/document-parser'

// Supabase Admin Client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST: 배치 첨부파일 파싱 (Cron 또는 수동 실행용)
 * - attachment_urls가 있고 parsed_content가 null인 공고 처리
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = getSupabaseAdmin()

    // 요청 옵션
    let options = { limit: 10, source: null as string | null }
    try {
      const body = await request.json()
      options = { ...options, ...body }
    } catch {
      // 본문 없으면 기본값 사용
    }

    // 첨부파일 URL이 있고, parsed_content가 null인 공고 조회
    let query = supabase
      .from('announcements')
      .select('id, title, source, attachment_urls, content')
      .not('attachment_urls', 'is', null)
      .is('parsed_content', null)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(options.limit)

    if (options.source) {
      query = query.eq('source', options.source)
    }

    const { data: announcements, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    if (!announcements || announcements.length === 0) {
      return NextResponse.json({
        success: true,
        message: '파싱할 공고가 없어요',
        stats: { total: 0, parsed: 0, duration: `${Date.now() - startTime}ms` },
      })
    }

    console.log(`📄 첨부파일 파싱 시작: ${announcements.length}건`)

    let parsed = 0
    let failed = 0

    for (const ann of announcements) {
      try {
        const attachmentUrls = ann.attachment_urls as string[] | null

        if (!attachmentUrls || attachmentUrls.length === 0) {
          // 첨부파일이 없으면 기존 content를 parsed_content로 설정
          await supabase
            .from('announcements')
            .update({ parsed_content: ann.content || '' })
            .eq('id', ann.id)
          continue
        }

        console.log(`📄 파싱 중: ${ann.title} (${attachmentUrls.length}개 파일)`)

        // 첨부파일 파싱
        const parseResult = await parseMultipleDocuments(attachmentUrls)

        // 기존 content와 파싱된 내용 병합
        let parsedContent = ''

        // 기존 공고 내용
        if (ann.content) {
          parsedContent += `## 공고 본문\n\n${ann.content}\n\n`
        }

        // 첨부파일 내용
        if (parseResult.success && parseResult.combinedText) {
          parsedContent += `## 첨부파일 내용\n\n${parseResult.combinedText}`
        }

        // 텍스트 정리 및 길이 제한 (AI 토큰 제한 고려)
        const cleanedContent = cleanAndTruncateText(parsedContent, 100000)

        // DB 업데이트
        const { error: updateError } = await supabase
          .from('announcements')
          .update({ parsed_content: cleanedContent })
          .eq('id', ann.id)

        if (updateError) {
          console.error(`업데이트 오류 (${ann.id}):`, updateError.message)
          failed++
        } else {
          parsed++
          console.log(
            `✅ 파싱 완료: ${ann.title} (${cleanedContent.length}자)`
          )
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`파싱 오류 (${ann.id}):`, error)
        failed++

        // 에러 발생해도 빈 값으로 설정하여 재시도 방지
        await supabase
          .from('announcements')
          .update({ parsed_content: ann.content || '' })
          .eq('id', ann.id)
      }
    }

    const duration = Date.now() - startTime

    console.log(
      `✅ 첨부파일 파싱 완료: ${parsed}건 성공, ${failed}건 실패, ${duration}ms`
    )

    return NextResponse.json({
      success: true,
      message: '첨부파일 파싱 완료',
      stats: {
        total: announcements.length,
        parsed,
        failed,
        duration: `${duration}ms`,
        parsedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('첨부파일 파싱 오류:', error)
    return NextResponse.json(
      { success: false, error: '파싱 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

/**
 * GET: 단일 공고 첨부파일 파싱
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { success: false, error: '공고 ID가 필요해요' },
      { status: 400 }
    )
  }

  try {
    const supabase = getSupabaseAdmin()

    // 공고 조회
    const { data: announcement, error: fetchError } = await supabase
      .from('announcements')
      .select('id, title, source, content, attachment_urls')
      .eq('id', id)
      .single()

    if (fetchError || !announcement) {
      return NextResponse.json(
        { success: false, error: '공고를 찾을 수 없어요' },
        { status: 404 }
      )
    }

    const attachmentUrls = announcement.attachment_urls as string[] | null

    if (!attachmentUrls || attachmentUrls.length === 0) {
      // 첨부파일이 없으면 기존 content를 parsed_content로 설정
      await supabase
        .from('announcements')
        .update({ parsed_content: announcement.content || '' })
        .eq('id', id)

      return NextResponse.json({
        success: true,
        message: '첨부파일이 없어서 기존 내용을 사용해요',
        parsedLength: (announcement.content || '').length,
      })
    }

    console.log(
      `📄 단일 파싱: ${announcement.title} (${attachmentUrls.length}개 파일)`
    )

    // 첨부파일 파싱
    const parseResult = await parseMultipleDocuments(attachmentUrls)

    // 기존 content와 파싱된 내용 병합
    let parsedContent = ''

    if (announcement.content) {
      parsedContent += `## 공고 본문\n\n${announcement.content}\n\n`
    }

    if (parseResult.success && parseResult.combinedText) {
      parsedContent += `## 첨부파일 내용\n\n${parseResult.combinedText}`
    }

    const cleanedContent = cleanAndTruncateText(parsedContent, 100000)

    // DB 업데이트
    await supabase
      .from('announcements')
      .update({ parsed_content: cleanedContent })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      message: `${attachmentUrls.length}개 첨부파일 파싱 완료`,
      parsedLength: cleanedContent.length,
      filesProcessed: parseResult.results.map((r) => ({
        url: r.url,
        success: r.result.success,
        format: r.result.format,
        textLength: r.result.text.length,
        error: r.result.error,
      })),
    })
  } catch (error) {
    console.error('첨부파일 파싱 오류:', error)
    return NextResponse.json(
      { success: false, error: '파싱 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scrapeAttachments, extractDetailUrl } from '@/lib/scraping/attachment-scraper'

// Supabase Admin Client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// 배치 스크래핑 (Cron 또는 수동 실행용)
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = getSupabaseAdmin()

    // 요청 본문에서 옵션 가져오기
    let options = { limit: 50, source: null as string | null }
    try {
      const body = await request.json()
      options = { ...options, ...body }
    } catch {
      // 본문 없으면 기본값 사용
    }

    // 첨부파일이 null인 공고들 조회 (최근 것부터)
    let query = supabase
      .from('announcements')
      .select('id, source, content, attachment_urls')
      .is('attachment_urls', null)
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
        message: '스크래핑할 공고가 없어요',
        stats: { total: 0, scraped: 0, duration: `${Date.now() - startTime}ms` }
      })
    }

    console.log(`🔍 첨부파일 스크래핑 시작: ${announcements.length}건`)

    let scraped = 0
    let failed = 0

    // 순차적으로 스크래핑 (서버 부하 방지)
    for (const ann of announcements) {
      try {
        // content에서 상세 URL 추출
        const detailUrl = extractDetailUrl(ann.content || '', ann.source)

        if (!detailUrl) {
          // URL이 없으면 빈 배열로 설정
          await supabase
            .from('announcements')
            .update({ attachment_urls: [] })
            .eq('id', ann.id)
          continue
        }

        // 스크래핑
        const attachmentUrls = await scrapeAttachments(ann.source, detailUrl)

        // DB 업데이트
        const { error: updateError } = await supabase
          .from('announcements')
          .update({ attachment_urls: attachmentUrls })
          .eq('id', ann.id)

        if (updateError) {
          console.error(`Update error for ${ann.id}:`, updateError.message)
          failed++
        } else {
          scraped++
          if (attachmentUrls.length > 0) {
            console.log(`✅ ${ann.id}: ${attachmentUrls.length}개 첨부파일 발견`)
          }
        }

        // Rate limiting: 요청 간 딜레이
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`Scraping error for ${ann.id}:`, error)
        failed++
        // 에러 발생해도 빈 배열로 설정하여 재시도 방지
        await supabase
          .from('announcements')
          .update({ attachment_urls: [] })
          .eq('id', ann.id)
      }
    }

    const duration = Date.now() - startTime

    console.log(`✅ 첨부파일 스크래핑 완료: ${scraped}건 성공, ${failed}건 실패, ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: '첨부파일 스크래핑 완료',
      stats: {
        total: announcements.length,
        scraped,
        failed,
        duration: `${duration}ms`,
        scrapedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('첨부파일 스크래핑 오류:', error)
    return NextResponse.json(
      { success: false, error: '스크래핑 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

// 단일 공고 첨부파일 스크래핑
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
      .select('id, source, content')
      .eq('id', id)
      .single()

    if (fetchError || !announcement) {
      return NextResponse.json(
        { success: false, error: '공고를 찾을 수 없어요' },
        { status: 404 }
      )
    }

    // content에서 상세 URL 추출
    const detailUrl = extractDetailUrl(announcement.content || '', announcement.source)

    if (!detailUrl) {
      await supabase
        .from('announcements')
        .update({ attachment_urls: [] })
        .eq('id', id)

      return NextResponse.json({
        success: true,
        message: '상세 URL이 없어서 첨부파일을 가져올 수 없어요',
        attachments: []
      })
    }

    // 스크래핑
    const attachmentUrls = await scrapeAttachments(announcement.source, detailUrl)

    // DB 업데이트
    await supabase
      .from('announcements')
      .update({ attachment_urls: attachmentUrls })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      message: `${attachmentUrls.length}개의 첨부파일을 찾았어요`,
      attachments: attachmentUrls
    })

  } catch (error) {
    console.error('첨부파일 스크래핑 오류:', error)
    return NextResponse.json(
      { success: false, error: '스크래핑 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

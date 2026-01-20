import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/gemini'
import crypto from 'crypto'

const ADMIN_EMAILS = ['choishiam@gmail.com']
const BATCH_SIZE = 10 // 한 번에 처리할 공고 수
const DELAY_MS = 1000 // API 호출 간 딜레이 (Rate Limit 방지)

// 텍스트 해시 생성 (변경 감지용)
function generateHash(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex')
}

// 공고 내용을 임베딩용 텍스트로 변환
function prepareEmbeddingText(announcement: {
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  target_company: string | null
  content: string | null
  parsed_content: string | null
}): string {
  const parts = [
    `제목: ${announcement.title}`,
    announcement.organization ? `기관: ${announcement.organization}` : '',
    announcement.category ? `분야: ${announcement.category}` : '',
    announcement.support_type ? `지원유형: ${announcement.support_type}` : '',
    announcement.target_company ? `지원대상: ${announcement.target_company}` : '',
    announcement.parsed_content || announcement.content || '',
  ]

  return parts.filter(Boolean).join('\n').slice(0, 10000) // 최대 10000자
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ success: false, error: '권한이 없어요' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { announcementId, forceRegenerate = false } = body

    let query = supabase
      .from('announcements')
      .select('id, title, organization, category, support_type, target_company, content, parsed_content')
      .eq('status', 'active')

    if (announcementId) {
      query = query.eq('id', announcementId)
    }

    const { data: announcements, error: fetchError } = await query as {
      data: Array<{
        id: string
        title: string
        organization: string | null
        category: string | null
        support_type: string | null
        target_company: string | null
        content: string | null
        parsed_content: string | null
      }> | null
      error: any
    }

    if (fetchError) {
      throw fetchError
    }

    if (!announcements || announcements.length === 0) {
      return NextResponse.json({
        success: true,
        message: '벡터화할 공고가 없어요',
        processed: 0,
      })
    }

    // 기존 임베딩 조회 (변경 감지용)
    const { data: existingEmbeddings } = await supabase
      .from('announcement_embeddings')
      .select('announcement_id, content_hash') as { data: { announcement_id: string; content_hash: string }[] | null }

    const existingMap = new Map(
      existingEmbeddings?.map(e => [e.announcement_id, e.content_hash]) || []
    )

    let processed = 0
    let skipped = 0
    let errors: string[] = []

    // 배치 처리
    for (let i = 0; i < announcements.length; i += BATCH_SIZE) {
      const batch = announcements.slice(i, i + BATCH_SIZE)

      for (const announcement of batch) {
        try {
          const text = prepareEmbeddingText(announcement)
          const contentHash = generateHash(text)

          // 변경되지 않은 경우 스킵 (forceRegenerate가 false일 때)
          if (!forceRegenerate && existingMap.get(announcement.id) === contentHash) {
            skipped++
            continue
          }

          // 임베딩 생성
          const embedding = await generateEmbedding(text)

          // Supabase에 저장 (upsert)
          const { error: upsertError } = await (supabase
            .from('announcement_embeddings') as any)
            .upsert({
              announcement_id: announcement.id,
              embedding: `[${embedding.join(',')}]`,
              content_hash: contentHash,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'announcement_id',
            })

          if (upsertError) {
            console.error(`Embedding upsert error for ${announcement.id}:`, upsertError)
            errors.push(`${announcement.id}: ${upsertError.message}`)
            continue
          }

          processed++

          // Rate Limit 방지
          await new Promise(resolve => setTimeout(resolve, DELAY_MS))
        } catch (embeddingError) {
          console.error(`Embedding generation error for ${announcement.id}:`, embeddingError)
          errors.push(`${announcement.id}: ${embeddingError}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${processed}개 공고를 벡터화했어요`,
      processed,
      skipped,
      total: announcements.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Embedding generation error:', error)
    return NextResponse.json(
      { success: false, error: '벡터화에 실패했어요' },
      { status: 500 }
    )
  }
}

// GET: 임베딩 상태 조회
export async function GET() {
  try {
    const supabase = await createServiceClient()

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ success: false, error: '권한이 없어요' }, { status: 403 })
    }

    // 전체 공고 수
    const { count: totalAnnouncements } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // 임베딩 완료된 공고 수
    const { count: embeddedCount } = await supabase
      .from('announcement_embeddings')
      .select('*', { count: 'exact', head: true })

    // 최근 업데이트
    const { data: latestEmbedding } = await supabase
      .from('announcement_embeddings')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single() as { data: { updated_at: string } | null }

    return NextResponse.json({
      success: true,
      data: {
        totalAnnouncements: totalAnnouncements || 0,
        embeddedCount: embeddedCount || 0,
        pendingCount: (totalAnnouncements || 0) - (embeddedCount || 0),
        lastUpdated: latestEmbedding?.updated_at || null,
      },
    })
  } catch (error) {
    console.error('Embedding status error:', error)
    return NextResponse.json(
      { success: false, error: '상태 조회에 실패했어요' },
      { status: 500 }
    )
  }
}

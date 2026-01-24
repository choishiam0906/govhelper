import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/gemini'
import crypto from 'crypto'
import {
  parallelBatchWithRetry,
  summarizeBatchResults,
} from '@/lib/utils/parallel-batch'

const ADMIN_EMAILS = ['choishiam@gmail.com']
const CONCURRENCY = 5 // 동시 처리 수
const DELAY_BETWEEN_BATCHES = 500 // 배치 간 딜레이 (ms)

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

    // 변경되지 않은 공고 필터링
    const announcementsToProcess = forceRegenerate
      ? announcements
      : announcements.filter(ann => {
          const text = prepareEmbeddingText(ann)
          const contentHash = generateHash(text)
          return existingMap.get(ann.id) !== contentHash
        })

    const skipped = announcements.length - announcementsToProcess.length
    const errors: string[] = []

    if (announcementsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: '변경된 공고가 없어요',
        processed: 0,
        skipped,
        total: announcements.length,
      })
    }

    console.log(`🔄 임베딩 생성 시작: ${announcementsToProcess.length}건 (병렬 처리)`)

    // 병렬 배치 처리
    const results = await parallelBatchWithRetry(
      announcementsToProcess,
      async (announcement) => {
        const text = prepareEmbeddingText(announcement)
        const contentHash = generateHash(text)

        // 임베딩 생성
        const embedding = await generateEmbedding(text)

        // Supabase에 저장 (upsert)
        const { error: upsertError } = await (supabase
          .from('announcement_embeddings') as ReturnType<typeof supabase.from>)
          .upsert({
            announcement_id: announcement.id,
            embedding: `[${embedding.join(',')}]`,
            content_hash: contentHash,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'announcement_id',
          })

        if (upsertError) {
          throw new Error(`DB 저장 실패: ${upsertError.message}`)
        }

        console.log(`✅ ${announcement.id}: 임베딩 생성 완료`)
        return embedding
      },
      {
        concurrency: CONCURRENCY,
        delayBetweenBatches: DELAY_BETWEEN_BATCHES,
        onProgress: (completed, total) => {
          console.log(`📊 진행률: ${completed}/${total} (${Math.round(completed / total * 100)}%)`)
        }
      },
      2 // 최대 2회 재시도
    )

    const summary = summarizeBatchResults(results)

    // 에러 수집
    results.filter(r => !r.success).forEach(r => {
      const ann = announcementsToProcess[r.index]
      errors.push(`${ann.id}: ${r.error?.message || '알 수 없는 오류'}`)
    })

    console.log(`✅ 임베딩 생성 완료: ${summary.succeeded}건 성공, ${summary.failed}건 실패`)

    return NextResponse.json({
      success: true,
      message: `${summary.succeeded}개 공고를 벡터화했어요`,
      processed: summary.succeeded,
      skipped,
      total: announcements.length,
      successRate: `${summary.successRate.toFixed(1)}%`,
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

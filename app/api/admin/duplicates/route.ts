import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  detectDuplicates,
  groupDuplicates,
  type DuplicateCandidate,
} from '@/lib/announcements/duplicate-detector'

/**
 * GET /api/admin/duplicates
 * 중복 공고 후보 목록 조회
 *
 * Query Parameters:
 * - threshold: 유사도 임계값 (기본: 90)
 * - source: 특정 소스만 조회 (선택)
 * - groupBy: 'none' | 'group' (기본: 'none')
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 관리자 권한 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요해요' },
        { status: 401 }
      )
    }

    // 관리자 확인
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!user.email || !adminEmails.includes(user.email)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요해요' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const threshold = parseInt(searchParams.get('threshold') || '90')
    const source = searchParams.get('source')
    const groupBy = searchParams.get('groupBy') || 'none'

    // 활성 공고 조회
    let query = supabase
      .from('announcements')
      .select('id, title, organization, application_end, source, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (source) {
      query = query.eq('source', source)
    }

    const { data: announcements, error } = await query

    if (error) {
      throw error
    }

    if (!announcements || announcements.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          duplicates: [],
          groups: [],
          total: 0,
        },
      })
    }

    // 중복 감지
    const duplicates = detectDuplicates(announcements, {
      similarityThreshold: threshold,
      dateDiffDays: 3,
    })

    // 그룹화 옵션
    const groups = groupBy === 'group' ? groupDuplicates(duplicates) : []

    // 중복 공고 상세 정보 조회
    const duplicateIdsSet = new Set<string>()
    duplicates.forEach(d => {
      duplicateIdsSet.add(d.originalId)
      duplicateIdsSet.add(d.duplicateId)
    })

    const duplicateIdsArray = Array.from(duplicateIdsSet)

    const { data: detailedAnnouncements } = await supabase
      .from('announcements')
      .select('id, title, organization, source, application_end, support_amount, created_at')
      .in('id', duplicateIdsArray)

    type DetailedAnnouncement = {
      id: string
      title: string
      organization: string | null
      source: string
      application_end: string | null
      support_amount: string | null
      created_at: string
    }

    const announcementMap = new Map<string, DetailedAnnouncement>(
      (detailedAnnouncements as DetailedAnnouncement[] | null)?.map(a => [a.id, a]) || []
    )

    // 중복 후보에 상세 정보 추가
    const enrichedDuplicates = duplicates.map(d => ({
      ...d,
      original: announcementMap.get(d.originalId),
      duplicate: announcementMap.get(d.duplicateId),
    }))

    return NextResponse.json({
      success: true,
      data: {
        duplicates: enrichedDuplicates,
        groups: groups.map(g => ({
          ...g,
          announcements: g.ids.map(id => announcementMap.get(id)).filter(Boolean),
        })),
        total: duplicates.length,
        threshold,
      },
    })
  } catch (error) {
    console.error('중복 공고 조회 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '중복 공고 조회에 실패했어요',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/duplicates
 * 중복 공고 처리 (병합/삭제)
 *
 * Body:
 * {
 *   action: 'merge' | 'delete',
 *   originalId: string,     // 유지할 공고 ID (merge 시)
 *   duplicateIds: string[], // 중복 공고 ID 목록
 * }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 관리자 권한 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요해요' },
        { status: 401 }
      )
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!user.email || !adminEmails.includes(user.email)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요해요' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, originalId, duplicateIds } = body

    if (!action || !duplicateIds || !Array.isArray(duplicateIds)) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 부족해요' },
        { status: 400 }
      )
    }

    if (action === 'merge') {
      // 병합: 중복 공고의 정보를 원본에 통합
      if (!originalId) {
        return NextResponse.json(
          { success: false, error: 'originalId가 필요해요' },
          { status: 400 }
        )
      }

      // 원본 공고 조회
      const { data: original, error: originalError } = await supabase
        .from('announcements')
        .select('id, attachment_urls')
        .eq('id', originalId)
        .single()

      if (originalError || !original) {
        return NextResponse.json(
          { success: false, error: '원본 공고를 찾을 수 없어요' },
          { status: 404 }
        )
      }

      // 중복 공고 조회
      const { data: duplicates, error: duplicatesError } = await supabase
        .from('announcements')
        .select('id, attachment_urls')
        .in('id', duplicateIds)

      if (duplicatesError || !duplicates) {
        throw duplicatesError
      }

      type AnnouncementWithAttachments = {
        id: string
        attachment_urls: string[] | null
      }

      // 병합 로직: 첨부파일 URL 통합
      const mergedAttachmentUrls = [
        ...new Set([
          ...((original as AnnouncementWithAttachments).attachment_urls || []),
          ...(duplicates as AnnouncementWithAttachments[]).flatMap(d => d.attachment_urls || []),
        ]),
      ]

      // 원본 공고 업데이트
      const { error: updateError } = await (supabase as any).rpc('update_announcement_attachments', {
        p_announcement_id: originalId,
        p_attachment_urls: mergedAttachmentUrls,
      })

      if (updateError) {
        throw updateError
      }

      // 중복 공고 소프트 삭제 (status를 'merged'로 변경)
      const { error: deleteError } = await (supabase as any).rpc('close_announcements', {
        p_announcement_ids: duplicateIds,
      })

      if (deleteError) {
        throw deleteError
      }

      return NextResponse.json({
        success: true,
        data: {
          originalId,
          mergedCount: duplicateIds.length,
          attachmentUrlsCount: mergedAttachmentUrls.length,
        },
        message: `${duplicateIds.length}개 공고를 병합했어요`,
      })
    } else if (action === 'delete') {
      // 삭제: 중복 공고를 소프트 삭제
      const { error: deleteError } = await (supabase as any).rpc('close_announcements', {
        p_announcement_ids: duplicateIds,
      })

      if (deleteError) {
        throw deleteError
      }

      return NextResponse.json({
        success: true,
        data: {
          deletedCount: duplicateIds.length,
        },
        message: `${duplicateIds.length}개 공고를 삭제했어요`,
      })
    } else {
      return NextResponse.json(
        { success: false, error: '지원하지 않는 액션이에요' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('중복 공고 처리 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '중복 공고 처리에 실패했어요',
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/admin'
import {
  calculateQualityScore,
  getQualityGrade,
  calculateQualityStats,
  type QualityScoreBreakdown,
} from '@/lib/announcements/quality-score'

/**
 * GET /api/admin/quality
 * 품질 점수 통계 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()

    // 관리자 권한 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json(
        { success: false, error: '권한이 없어요' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const announcementId = searchParams.get('id')

    // 개별 공고 품질 점수 상세 조회
    if (announcementId) {
      const { data: announcement, error } = await supabase
        .from('announcements')
        .select(
          `
          id,
          title,
          organization,
          source,
          status,
          content,
          parsed_content,
          eligibility_criteria,
          application_start,
          application_end,
          support_amount,
          attachment_urls
        `
        )
        .eq('id', announcementId)
        .single()

      if (error || !announcement) {
        return NextResponse.json(
          { success: false, error: '공고를 찾을 수 없어요' },
          { status: 404 }
        )
      }

      const scoreResult = calculateQualityScore(announcement)
      const grade = getQualityGrade(scoreResult.totalScore)

      const ann = announcement as any
      return NextResponse.json({
        success: true,
        data: {
          announcement: {
            id: ann.id,
            title: ann.title,
            organization: ann.organization,
            source: ann.source,
          },
          score: scoreResult,
          grade,
        },
      })
    }

    // 전체 품질 점수 통계 조회
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select(
        `
        id,
        title,
        organization,
        source,
        status,
        content,
        parsed_content,
        eligibility_criteria,
        application_start,
        application_end,
        support_amount,
        attachment_urls
      `
      )

    if (error) {
      throw error
    }

    if (!announcements || announcements.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          total: 0,
          stats: {
            average: 0,
            median: 0,
            min: 0,
            max: 0,
            distribution: { A: 0, B: 0, C: 0, D: 0 },
          },
          bySource: {},
        },
      })
    }

    // 전체 공고 점수 계산
    const scores: number[] = []
    const bySource: Record<
      string,
      {
        count: number
        averageScore: number
        distribution: { A: number; B: number; C: number; D: number }
      }
    > = {}
    const detailedBreakdown: QualityScoreBreakdown[] = []

    announcements.forEach((announcement) => {
      const ann = announcement as any
      const scoreResult = calculateQualityScore(ann)
      scores.push(scoreResult.totalScore)
      detailedBreakdown.push(scoreResult)

      const source = ann.source || 'unknown'
      if (!bySource[source]) {
        bySource[source] = {
          count: 0,
          averageScore: 0,
          distribution: { A: 0, B: 0, C: 0, D: 0 },
        }
      }

      bySource[source].count++

      const grade = getQualityGrade(scoreResult.totalScore)
      bySource[source].distribution[grade.grade as 'A' | 'B' | 'C' | 'D']++
    })

    // 소스별 평균 점수 계산
    Object.keys(bySource).forEach((source) => {
      const sourceScores = announcements
        .filter((a) => ((a as any).source || 'unknown') === source)
        .map((a) => calculateQualityScore(a as any).totalScore)

      bySource[source].averageScore =
        Math.round(
          (sourceScores.reduce((sum, s) => sum + s, 0) / sourceScores.length) *
            10
        ) / 10
    })

    const stats = calculateQualityStats(scores)

    // 필드별 완성도
    const fieldCompletion = {
      basicInfo: 0,
      description: 0,
      eligibility: 0,
      dates: 0,
      supportAmount: 0,
      attachments: 0,
    }

    detailedBreakdown.forEach((breakdown) => {
      fieldCompletion.basicInfo += breakdown.breakdown.basicInfo
      fieldCompletion.description += breakdown.breakdown.description
      fieldCompletion.eligibility += breakdown.breakdown.eligibility
      fieldCompletion.dates += breakdown.breakdown.dates
      fieldCompletion.supportAmount += breakdown.breakdown.supportAmount
      fieldCompletion.attachments += breakdown.breakdown.attachments
    })

    // 평균 필드별 점수 계산
    const avgFieldCompletion = {
      basicInfo:
        Math.round(
          (fieldCompletion.basicInfo / announcements.length / 20) * 100
        ) / 100,
      description:
        Math.round(
          (fieldCompletion.description / announcements.length / 20) * 100
        ) / 100,
      eligibility:
        Math.round(
          (fieldCompletion.eligibility / announcements.length / 20) * 100
        ) / 100,
      dates:
        Math.round((fieldCompletion.dates / announcements.length / 15) * 100) /
        100,
      supportAmount:
        Math.round(
          (fieldCompletion.supportAmount / announcements.length / 15) * 100
        ) / 100,
      attachments:
        Math.round(
          (fieldCompletion.attachments / announcements.length / 10) * 100
        ) / 100,
    }

    return NextResponse.json({
      success: true,
      data: {
        total: announcements.length,
        stats,
        bySource,
        fieldCompletion: avgFieldCompletion,
      },
    })
  } catch (error) {
    console.error('Quality API error:', error)
    return NextResponse.json(
      { success: false, error: '품질 점수를 조회하지 못했어요' },
      { status: 500 }
    )
  }
}

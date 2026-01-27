import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getExperiment, getActiveExperiments } from '@/lib/ab-testing'

// 관리자 이메일 목록
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())

/**
 * 카이제곱 검정 (Chi-Square Test)
 * 두 그룹 간 전환율 차이의 통계적 유의성 계산
 */
function chiSquareTest(
  assignmentsA: number,
  conversionsA: number,
  assignmentsB: number,
  conversionsB: number
): { chiSquare: number; pValue: number } {
  const totalAssignments = assignmentsA + assignmentsB
  const totalConversions = conversionsA + conversionsB
  const totalNonConversions = totalAssignments - totalConversions

  if (totalAssignments === 0 || totalConversions === 0 || totalNonConversions === 0) {
    return { chiSquare: 0, pValue: 1 }
  }

  // 기대값 계산
  const expectedConvA = (assignmentsA * totalConversions) / totalAssignments
  const expectedNonConvA = (assignmentsA * totalNonConversions) / totalAssignments
  const expectedConvB = (assignmentsB * totalConversions) / totalAssignments
  const expectedNonConvB = (assignmentsB * totalNonConversions) / totalAssignments

  // 카이제곱 값 계산
  const chiSquare =
    Math.pow(conversionsA - expectedConvA, 2) / expectedConvA +
    Math.pow(assignmentsA - conversionsA - expectedNonConvA, 2) / expectedNonConvA +
    Math.pow(conversionsB - expectedConvB, 2) / expectedConvB +
    Math.pow(assignmentsB - conversionsB - expectedNonConvB, 2) / expectedNonConvB

  // p-value 근사 (자유도 1)
  // 간단한 근사: chi-square > 3.84 → p < 0.05
  let pValue = 1
  if (chiSquare > 10.83) pValue = 0.001
  else if (chiSquare > 6.64) pValue = 0.01
  else if (chiSquare > 3.84) pValue = 0.05
  else if (chiSquare > 2.71) pValue = 0.1
  else pValue = 0.5

  return { chiSquare: Math.round(chiSquare * 100) / 100, pValue }
}

/**
 * GET /api/admin/ab-testing
 * 실험 결과 조회
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // 사용자 인증 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
  }

  const experimentId = request.nextUrl.searchParams.get('experiment')

  // 특정 실험 결과 조회
  if (experimentId) {
    const experiment = getExperiment(experimentId)
    if (!experiment) {
      return NextResponse.json({ error: '실험을 찾을 수 없습니다' }, { status: 404 })
    }

    // 할당 수 조회 (테이블이 아직 생성 안 된 경우 대비)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: assignments } = await (supabase as any)
      .from('ab_assignments')
      .select('variant')
      .eq('experiment_id', experimentId) as { data: { variant: string }[] | null }

    // 전환 수 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: conversions } = await (supabase as any)
      .from('ab_conversions')
      .select('variant, revenue')
      .eq('experiment_id', experimentId) as { data: { variant: string; revenue: number }[] | null }

    // 변형별 집계
    const variantStats: Record<string, {
      assignments: number
      conversions: number
      totalRevenue: number
    }> = {}

    for (const variant of experiment.variants) {
      variantStats[variant.id] = { assignments: 0, conversions: 0, totalRevenue: 0 }
    }

    // 할당 집계
    for (const a of assignments || []) {
      if (variantStats[a.variant]) {
        variantStats[a.variant].assignments++
      }
    }

    // 전환 집계
    for (const c of conversions || []) {
      if (variantStats[c.variant]) {
        variantStats[c.variant].conversions++
        variantStats[c.variant].totalRevenue += c.revenue || 0
      }
    }

    // 결과 포맷팅
    const results: Record<string, unknown> = {}
    for (const variant of experiment.variants) {
      const stats = variantStats[variant.id]
      results[`variant${variant.id}`] = {
        name: variant.name,
        assignments: stats.assignments,
        conversions: stats.conversions,
        conversionRate: stats.assignments > 0
          ? Math.round((stats.conversions / stats.assignments) * 1000) / 1000
          : 0,
        totalRevenue: stats.totalRevenue,
        averageRevenue: stats.conversions > 0
          ? Math.round(stats.totalRevenue / stats.conversions)
          : 0,
      }
    }

    // 통계적 유의성 계산 (A vs B)
    const statsA = variantStats['A'] || { assignments: 0, conversions: 0 }
    const statsB = variantStats['B'] || { assignments: 0, conversions: 0 }
    const { chiSquare, pValue } = chiSquareTest(
      statsA.assignments,
      statsA.conversions,
      statsB.assignments,
      statsB.conversions
    )

    results.statistics = {
      chiSquare,
      pValue,
      significantAt5Percent: pValue <= 0.05,
      significantAt10Percent: pValue <= 0.1,
      sampleSize: statsA.assignments + statsB.assignments,
      minimumSampleRecommended: 200,
    }

    return NextResponse.json({
      success: true,
      experiment: {
        id: experiment.id,
        name: experiment.name,
        status: experiment.status,
        startDate: experiment.startDate,
      },
      results,
    })
  }

  // 전체 실험 목록
  const experiments = getActiveExperiments()
  return NextResponse.json({
    success: true,
    experiments: experiments.map(e => ({
      id: e.id,
      name: e.name,
      status: e.status,
      variants: e.variants.map(v => v.name),
    })),
  })
}

/**
 * POST /api/admin/ab-testing
 * 실험 상태 변경
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 사용자 인증 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
  }

  const body = await request.json()
  const { experimentId, action } = body

  if (!experimentId || !action) {
    return NextResponse.json({ error: 'experimentId와 action이 필요합니다' }, { status: 400 })
  }

  // 실험 상태 변경
  const newStatus = action === 'start' ? 'running'
    : action === 'pause' ? 'paused'
    : action === 'complete' ? 'completed'
    : null

  if (!newStatus) {
    return NextResponse.json({ error: '유효하지 않은 action입니다' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ab_experiments')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(newStatus === 'completed' ? { end_date: new Date().toISOString() } : {}),
    })
    .eq('id', experimentId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `실험이 ${newStatus} 상태로 변경되었습니다`,
  })
}

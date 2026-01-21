import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServiceClient()

    // 매칭 결과 조회 (guest_matches 테이블은 Supabase 타입 정의에 없으므로 any 캐스팅)
    const { data, error } = await (supabase as any)
      .from('guest_matches')
      .select(`
        id,
        matches,
        top_revealed,
        created_at,
        guest_leads (
          id,
          email,
          company_name,
          industry,
          employee_count,
          location
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: '결과를 찾을 수 없어요' },
        { status: 404 }
      )
    }

    // 타입 캐스팅
    const matchData = data as {
      id: string
      matches: any[]
      top_revealed: boolean
      created_at: string
      guest_leads: {
        id: string
        email: string
        company_name: string
        industry: string
        employee_count: number
        location: string
      } | null
    }

    // 1~2순위 블러 처리 (결제 안 한 경우)
    const matches = matchData.matches || []
    const processedMatches = matches.map((match, index) => {
      const isBlurred = index < 2 && !matchData.top_revealed

      if (isBlurred) {
        return {
          rank: match.rank,
          score: match.score,
          // 블러 처리된 정보
          title: '****** 지원사업',
          organization: '******',
          category: match.category,
          support_type: match.support_type,
          support_amount: '******',
          application_end: match.application_end,
          summary: '결제 후 확인할 수 있어요',
          strengths: ['결제 후 확인 가능'],
          weaknesses: ['결제 후 확인 가능'],
          blurred: true,
        }
      }

      return {
        ...match,
        blurred: false,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: matchData.id,
        matches: processedMatches,
        topRevealed: matchData.top_revealed,
        createdAt: matchData.created_at,
        company: {
          name: matchData.guest_leads?.company_name,
          industry: matchData.guest_leads?.industry,
          employeeCount: matchData.guest_leads?.employee_count,
          location: matchData.guest_leads?.location,
        },
      },
    })
  } catch (error) {
    console.error('Guest matching result error:', error)
    return NextResponse.json(
      { success: false, error: '결과 조회 중 오류가 발생했어요' },
      { status: 500 }
    )
  }
}

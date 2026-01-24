/**
 * 뉴스레터 구독자 동기화 확인 스크립트
 *
 * 사용법:
 * npx tsx scripts/check-newsletter-sync.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// .env.local 파일 로드
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log('📊 뉴스레터 구독자 현황 확인\n')

  // 전체 구독자 수
  const { count: totalCount } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })

  console.log(`전체 구독자: ${totalCount}명`)

  // 소스별 구독자 수
  const { data: bySource } = await supabase
    .from('newsletter_subscribers')
    .select('source')

  const sourceCounts: Record<string, number> = {}
  bySource?.forEach((row: { source: string | null }) => {
    const source = row.source || 'unknown'
    sourceCounts[source] = (sourceCounts[source] || 0) + 1
  })

  console.log('\n소스별 구독자:')
  Object.entries(sourceCounts).forEach(([source, count]) => {
    console.log(`  - ${source}: ${count}명`)
  })

  // 활성 구독자 수
  const { count: activeCount } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('confirmed', true)

  console.log(`\n활성 구독자 (발송 대상): ${activeCount}명`)

  // 최근 5명 샘플
  const { data: recentSubscribers } = await supabase
    .from('newsletter_subscribers')
    .select('email, name, source, confirmed, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('\n최근 구독자 5명:')
  recentSubscribers?.forEach((s: any) => {
    console.log(`  - ${s.email} (${s.name || '이름없음'}) - ${s.source} - ${s.confirmed ? '인증됨' : '미인증'}`)
  })
}

main().catch(console.error)

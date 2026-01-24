import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function runMigration() {
  console.log('========================================')
  console.log('Running Migration: 007_public_statistics')
  console.log('========================================\n')

  try {
    // 1. 테이블 생성 확인
    console.log('[1/5] Checking if table exists...')
    const { data: tableCheck } = await supabase
      .from('public_statistics')
      .select('id')
      .limit(1)

    if (tableCheck) {
      console.log('  Table already exists, skipping creation.')
    } else {
      console.log('  Table does not exist. Please run the SQL manually in Supabase Dashboard.')
      console.log('  Go to: Supabase Dashboard > SQL Editor')
      console.log('\n  Copy and paste the SQL from:')
      console.log('  supabase/migrations/007_public_statistics.sql')
      return
    }

    // 2. 초기 데이터 삽입
    console.log('\n[2/5] Inserting initial data...')
    const { error: insertError } = await supabase
      .from('public_statistics')
      .upsert({ id: 'main' }, { onConflict: 'id' })

    if (insertError) {
      console.log('  Insert error:', insertError.message)
    } else {
      console.log('  Initial data inserted.')
    }

    // 3. 통계 계산 (수동으로 계산)
    console.log('\n[3/5] Calculating statistics...')

    // 매칭 통계
    const { data: matches } = await supabase
      .from('matches')
      .select('match_score')

    const totalMatches = matches?.length || 0
    const avgMatchScore = totalMatches > 0
      ? matches!.reduce((sum, m) => sum + (m.match_score || 0), 0) / totalMatches
      : 0
    const highScoreMatches = matches?.filter(m => m.match_score >= 70).length || 0
    const successRate = totalMatches > 0 ? (highScoreMatches / totalMatches) * 100 : 0

    // 공고 통계
    const { count: totalAnnouncements } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })

    const { count: activeAnnouncements } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // 기업 통계
    const { count: totalCompanies } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })

    // 지원금액 통계
    const { data: announcementsWithAmount } = await supabase
      .from('announcements')
      .select('support_amount')
      .eq('status', 'active')
      .gt('support_amount', 0)

    const totalSupportAmount = announcementsWithAmount?.reduce((sum, a) => sum + (a.support_amount || 0), 0) || 0
    const avgSupportAmount = announcementsWithAmount && announcementsWithAmount.length > 0
      ? totalSupportAmount / announcementsWithAmount.length
      : 0

    // 비회원 통계
    const { count: totalGuestMatches } = await supabase
      .from('guest_matches')
      .select('*', { count: 'exact', head: true })

    const { count: guestTotal } = await supabase
      .from('guest_leads')
      .select('*', { count: 'exact', head: true })

    const { count: guestConverted } = await supabase
      .from('guest_leads')
      .select('*', { count: 'exact', head: true })
      .eq('converted_to_user', true)

    const guestConversionRate = guestTotal && guestTotal > 0
      ? ((guestConverted || 0) / guestTotal) * 100
      : 0

    console.log(`  Total matches: ${totalMatches}`)
    console.log(`  Avg match score: ${avgMatchScore.toFixed(2)}`)
    console.log(`  High score matches: ${highScoreMatches}`)
    console.log(`  Success rate: ${successRate.toFixed(2)}%`)
    console.log(`  Total announcements: ${totalAnnouncements}`)
    console.log(`  Active announcements: ${activeAnnouncements}`)
    console.log(`  Total companies: ${totalCompanies}`)
    console.log(`  Avg support amount: ${avgSupportAmount.toLocaleString()}원`)
    console.log(`  Guest matches: ${totalGuestMatches}`)

    // 4. 통계 업데이트
    console.log('\n[4/5] Updating statistics table...')
    const { error: updateError } = await supabase
      .from('public_statistics')
      .update({
        total_matches: totalMatches,
        avg_match_score: avgMatchScore,
        high_score_matches: highScoreMatches,
        success_rate: successRate,
        total_announcements: totalAnnouncements || 0,
        active_announcements: activeAnnouncements || 0,
        total_companies: totalCompanies || 0,
        total_support_amount: totalSupportAmount,
        avg_support_amount: avgSupportAmount,
        total_guest_matches: totalGuestMatches || 0,
        guest_conversion_rate: guestConversionRate,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'main')

    if (updateError) {
      console.log('  Update error:', updateError.message)
    } else {
      console.log('  Statistics updated successfully!')
    }

    // 5. 결과 확인
    console.log('\n[5/5] Verifying results...')
    const { data: result } = await supabase
      .from('public_statistics')
      .select('*')
      .eq('id', 'main')
      .single()

    if (result) {
      console.log('\n✅ Migration completed successfully!')
      console.log('\nCurrent statistics:')
      console.log(JSON.stringify(result, null, 2))
    }

  } catch (error) {
    console.error('Migration error:', error)
  }
}

runMigration()

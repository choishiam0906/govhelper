/**
 * 전체 공고 품질 점수 배치 업데이트 스크립트
 *
 * 사용법:
 * npx tsx scripts/update-quality-scores.ts
 */

import { createClient } from '@supabase/supabase-js'
import { calculateQualityScore, getQualityGrade } from '../lib/announcements/quality-score'

// .env.local에서 환경변수 로드
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\r?\n/g, '')
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/\r?\n/g, '')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수가 설정되지 않았습니다')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 배치 업데이트 크기
const BATCH_SIZE = 50

interface AnnouncementData {
  id: string
  title: string | null
  organization: string | null
  source: string | null
  status: string | null
  content: string | null
  parsed_content: string | null
  eligibility_criteria: {
    confidence?: number
  } | null
  application_start: string | null
  application_end: string | null
  support_amount: string | null
  attachment_urls: string[] | null
}

async function updateQualityScores() {
  console.log('🚀 품질 점수 배치 업데이트 시작\n')

  try {
    // 전체 공고 조회
    console.log('📊 공고 데이터 조회 중...')
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select(`
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
      `)

    if (error) {
      throw error
    }

    if (!announcements || announcements.length === 0) {
      console.log('⚠️  처리할 공고가 없습니다')
      return
    }

    console.log(`✅ ${announcements.length}개 공고 조회 완료\n`)

    // 품질 점수 계산 및 DB 업데이트
    console.log('🔄 품질 점수 계산 및 DB 업데이트 중...')
    const scores: number[] = []
    const byGrade = { A: 0, B: 0, C: 0, D: 0 }
    const bySource: Record<string, { count: number; totalScore: number }> = {}
    const updateData: Array<{ id: string; quality_score: number; quality_grade: string }> = []

    announcements.forEach((announcement: AnnouncementData) => {
      const scoreResult = calculateQualityScore(announcement)
      const gradeResult = getQualityGrade(scoreResult.totalScore)

      scores.push(scoreResult.totalScore)

      // 등급별 집계
      if (scoreResult.totalScore >= 90) byGrade.A++
      else if (scoreResult.totalScore >= 75) byGrade.B++
      else if (scoreResult.totalScore >= 60) byGrade.C++
      else byGrade.D++

      // 소스별 집계
      const source = announcement.source || 'unknown'
      if (!bySource[source]) {
        bySource[source] = { count: 0, totalScore: 0 }
      }
      bySource[source].count++
      bySource[source].totalScore += scoreResult.totalScore

      // DB 업데이트 데이터 수집
      updateData.push({
        id: announcement.id,
        quality_score: scoreResult.totalScore,
        quality_grade: gradeResult.grade,
      })
    })

    // 배치 업데이트 실행
    let updatedCount = 0
    for (let i = 0; i < updateData.length; i += BATCH_SIZE) {
      const batch = updateData.slice(i, i + BATCH_SIZE)

      const { error } = await supabase
        .from('announcements')
        .upsert(
          batch.map(item => ({
            id: item.id,
            quality_score: item.quality_score,
            quality_grade: item.quality_grade,
          })),
          { onConflict: 'id' }
        )

      if (error) {
        console.error(`❌ 배치 업데이트 오류 (${i}-${i + batch.length}):`, error)
      } else {
        updatedCount += batch.length
        console.log(`  ✓ ${updatedCount}/${updateData.length} 업데이트 완료`)
      }
    }

    console.log(`✅ DB 업데이트 완료: ${updatedCount}개 공고\n`)

    // 통계 출력
    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length
    const sortedScores = [...scores].sort((a, b) => a - b)
    const median =
      scores.length % 2 === 0
        ? (sortedScores[scores.length / 2 - 1] + sortedScores[scores.length / 2]) / 2
        : sortedScores[Math.floor(scores.length / 2)]

    console.log('📈 품질 점수 통계')
    console.log('─'.repeat(50))
    console.log(`평균 점수: ${average.toFixed(1)}점`)
    console.log(`중앙값: ${median.toFixed(1)}점`)
    console.log(`최저 점수: ${sortedScores[0]}점`)
    console.log(`최고 점수: ${sortedScores[sortedScores.length - 1]}점`)
    console.log()

    console.log('📊 등급별 분포')
    console.log('─'.repeat(50))
    console.log(`A등급 (90+): ${byGrade.A}개 (${((byGrade.A / announcements.length) * 100).toFixed(1)}%)`)
    console.log(`B등급 (75-89): ${byGrade.B}개 (${((byGrade.B / announcements.length) * 100).toFixed(1)}%)`)
    console.log(`C등급 (60-74): ${byGrade.C}개 (${((byGrade.C / announcements.length) * 100).toFixed(1)}%)`)
    console.log(`D등급 (0-59): ${byGrade.D}개 (${((byGrade.D / announcements.length) * 100).toFixed(1)}%)`)
    console.log()

    console.log('🏢 소스별 평균 점수')
    console.log('─'.repeat(50))
    Object.entries(bySource)
      .sort((a, b) => b[1].totalScore / b[1].count - a[1].totalScore / a[1].count)
      .forEach(([source, data]) => {
        const avg = (data.totalScore / data.count).toFixed(1)
        console.log(`${source}: ${avg}점 (${data.count}개)`)
      })
    console.log()

    // 품질 낮은 공고 상위 10개
    const lowQualityAnnouncements = announcements
      .map((a: AnnouncementData) => ({
        id: a.id,
        title: a.title,
        source: a.source,
        score: calculateQualityScore(a),
      }))
      .sort((a, b) => a.score.totalScore - b.score.totalScore)
      .slice(0, 10)

    console.log('⚠️  품질 개선이 필요한 공고 TOP 10')
    console.log('─'.repeat(50))
    lowQualityAnnouncements.forEach((item, index) => {
      console.log(
        `${index + 1}. [${item.score.totalScore}점] ${item.title} (${item.source})`
      )
      console.log(`   누락 필드: ${item.score.missingFields.join(', ')}`)
    })
    console.log()

    console.log('✅ 품질 점수 배치 업데이트 완료')
  } catch (error) {
    console.error('❌ 오류 발생:', error)
    throw error
  }
}

// 실행
updateQualityScores()
  .then(() => {
    console.log('\n✨ 배치 업데이트 완료')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 배치 업데이트 실패:', error)
    process.exit(1)
  })

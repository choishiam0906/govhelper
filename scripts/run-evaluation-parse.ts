/**
 * 기존 공고 평가기준 배치 추출 스크립트
 *
 * parsed_content가 있는 공고에서 평가기준을 추출합니다.
 * 5건씩 처리하고 결과를 출력합니다.
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { extractEvaluationCriteria } from '../lib/ai/gemini'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BATCH_SIZE = 5  // 한 번에 처리할 공고 수
const DELAY_BETWEEN_BATCHES = 3000  // 배치 간 딜레이 (ms)
const DELAY_BETWEEN_ITEMS = 1000  // 공고 간 딜레이 (ms)

async function runEvaluationParse() {
  let totalProcessed = 0
  let totalFound = 0
  let totalNotFound = 0
  let totalFailed = 0
  let hasMore = true

  console.log('=== 평가기준 배치 추출 시작 ===\n')

  while (hasMore) {
    // 파싱 필요한 공고 조회 (parsed_content가 있고, evaluation_parsed가 false인 것)
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('id, title, content, parsed_content')
      .eq('status', 'active')
      .or('evaluation_parsed.is.null,evaluation_parsed.eq.false')
      .not('parsed_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(BATCH_SIZE)

    if (error) {
      console.error('조회 오류:', error.message)
      break
    }

    if (!announcements || announcements.length === 0) {
      hasMore = false
      break
    }

    console.log(`\n배치 처리 중: ${announcements.length}건`)
    console.log('─'.repeat(50))

    for (const ann of announcements) {
      try {
        const title = ann.title ? ann.title.substring(0, 50) : '제목없음'
        const contentToAnalyze = ann.parsed_content || ann.content || ''

        // 컨텐츠가 너무 짧으면 스킵
        if (contentToAnalyze.length < 200) {
          console.log(`  [SKIP] ${title}... (내용 부족: ${contentToAnalyze.length}자)`)
          await supabase
            .from('announcements')
            .update({
              evaluation_parsed: true,
              evaluation_parsed_at: new Date().toISOString()
            })
            .eq('id', ann.id)
          totalNotFound++
          totalProcessed++
          continue
        }

        console.log(`  [분석] ${title}...`)

        // AI 평가기준 추출
        const result = await extractEvaluationCriteria(ann.title, contentToAnalyze)

        if (result.success && result.criteria) {
          // DB에 결과 저장
          const { error: updateError } = await supabase
            .from('announcements')
            .update({
              evaluation_criteria: result.criteria,
              evaluation_parsed: true,
              evaluation_parsed_at: new Date().toISOString()
            })
            .eq('id', ann.id)

          if (updateError) {
            console.error(`    [실패] DB 업데이트 오류: ${updateError.message}`)
            totalFailed++
          } else {
            const itemCount = result.criteria.items?.length || 0
            const bonusCount = result.criteria.bonusItems?.length || 0
            console.log(`    [완료] 평가항목 ${itemCount}개, 가점항목 ${bonusCount}개 (신뢰도: ${Math.round((result.criteria.confidence || 0) * 100)}%)`)
            totalFound++
          }
        } else {
          // 평가기준을 찾지 못한 경우
          await supabase
            .from('announcements')
            .update({
              evaluation_parsed: true,
              evaluation_parsed_at: new Date().toISOString()
            })
            .eq('id', ann.id)
          console.log(`    [미발견] ${result.error || '평가기준 없음'}`)
          totalNotFound++
        }

        totalProcessed++

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_ITEMS))
      } catch (error) {
        console.error(`    [오류] 처리 실패:`, error)
        totalFailed++
        totalProcessed++

        // 에러 발생해도 파싱 완료로 표시 (재시도 방지)
        await supabase
          .from('announcements')
          .update({
            evaluation_parsed: true,
            evaluation_parsed_at: new Date().toISOString()
          })
          .eq('id', ann.id)
      }
    }

    console.log(`\n진행 상황: ${totalProcessed}건 처리 (발견: ${totalFound}, 미발견: ${totalNotFound}, 실패: ${totalFailed})`)

    // 배치 간 딜레이
    if (announcements.length === BATCH_SIZE) {
      console.log(`\n${DELAY_BETWEEN_BATCHES/1000}초 대기 중...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('=== 평가기준 배치 추출 완료 ===')
  console.log(`총 처리: ${totalProcessed}건`)
  console.log(`평가기준 발견: ${totalFound}건`)
  console.log(`평가기준 없음: ${totalNotFound}건`)
  console.log(`실패: ${totalFailed}건`)
  console.log('='.repeat(50))
}

runEvaluationParse().catch(console.error)

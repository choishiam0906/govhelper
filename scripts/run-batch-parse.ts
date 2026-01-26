/**
 * 기존 공고 첨부파일 배치 파싱 스크립트
 * 5건씩 처리하고 결과를 출력합니다.
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import {
  parseMultipleDocuments,
  cleanAndTruncateText,
} from '../lib/document-parser'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BATCH_SIZE = 5  // 한 번에 처리할 공고 수
const DELAY_BETWEEN_BATCHES = 2000  // 배치 간 딜레이 (ms)

async function runBatchParse() {
  let totalProcessed = 0
  let totalSuccess = 0
  let totalFailed = 0
  let hasMore = true

  console.log('=== 첨부파일 배치 파싱 시작 ===\n')

  while (hasMore) {
    // 파싱 필요한 공고 조회
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('id, title, source, attachment_urls, content')
      .not('attachment_urls', 'is', null)
      .is('parsed_content', null)
      .eq('status', 'active')
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

    console.log('배치 처리 중: ' + announcements.length + '건')

    for (const ann of announcements) {
      try {
        const attachmentUrls = ann.attachment_urls as string[] | null
        const title = ann.title ? ann.title.substring(0, 40) : '제목없음'

        if (!attachmentUrls || attachmentUrls.length === 0) {
          // 첨부파일이 없으면 기존 content를 parsed_content로 설정
          await supabase
            .from('announcements')
            .update({ parsed_content: ann.content || '' })
            .eq('id', ann.id)
          totalSuccess++
          totalProcessed++
          continue
        }

        console.log('  파일: ' + title + '... (' + attachmentUrls.length + '개 파일)')

        // 첨부파일 파싱
        const parseResult = await parseMultipleDocuments(attachmentUrls)

        // 기존 content와 파싱된 내용 병합
        let parsedContent = ''

        if (ann.content) {
          parsedContent += '## 공고 본문\n\n' + ann.content + '\n\n'
        }

        if (parseResult.success && parseResult.combinedText) {
          parsedContent += '## 첨부파일 내용\n\n' + parseResult.combinedText
        }

        // 텍스트 정리 및 길이 제한
        const cleanedContent = cleanAndTruncateText(parsedContent, 100000)

        // DB 업데이트
        const { error: updateError } = await supabase
          .from('announcements')
          .update({ parsed_content: cleanedContent })
          .eq('id', ann.id)

        if (updateError) {
          console.error('    [실패] 업데이트 오류: ' + updateError.message)
          totalFailed++
        } else {
          console.log('    [완료] ' + cleanedContent.length + '자')
          totalSuccess++
        }

        totalProcessed++
      } catch (error) {
        console.error('    [실패] 파싱 오류:', error)
        totalFailed++
        totalProcessed++

        // 에러 발생해도 빈 값으로 설정하여 재시도 방지
        await supabase
          .from('announcements')
          .update({ parsed_content: ann.content || '' })
          .eq('id', ann.id)
      }
    }

    console.log('\n진행: ' + totalProcessed + '건 (성공: ' + totalSuccess + ', 실패: ' + totalFailed + ')\n')

    // 배치 간 딜레이
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
  }

  console.log('\n=== 배치 파싱 완료 ===')
  console.log('총 처리: ' + totalProcessed + '건')
  console.log('성공: ' + totalSuccess + '건')
  console.log('실패: ' + totalFailed + '건')
}

runBatchParse().catch(console.error)

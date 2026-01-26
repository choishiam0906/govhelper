import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkParseStatus() {
  // 첨부파일이 있고 파싱되지 않은 공고 수
  const { count: needsParsing, error: error1 } = await supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .not('attachment_urls', 'is', null)
    .is('parsed_content', null)
    .eq('status', 'active')

  // 첨부파일이 있고 파싱된 공고 수
  const { count: alreadyParsed, error: error2 } = await supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .not('attachment_urls', 'is', null)
    .not('parsed_content', 'is', null)
    .eq('status', 'active')

  // 첨부파일이 없는 공고 수
  const { count: noAttachments, error: error3 } = await supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .is('attachment_urls', null)
    .eq('status', 'active')

  console.log('=== 첨부파일 파싱 현황 ===')
  console.log(`파싱 필요: ${needsParsing}건`)
  console.log(`파싱 완료: ${alreadyParsed}건`)
  console.log(`첨부파일 없음: ${noAttachments}건`)
  
  if (error1 || error2 || error3) {
    console.error('오류:', error1 || error2 || error3)
  }
}

checkParseStatus()

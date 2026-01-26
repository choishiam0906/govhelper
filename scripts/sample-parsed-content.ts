import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getSamples() {
  // 평가기준이 포함된 것 같은 공고 샘플 조회
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, source, parsed_content')
    .not('parsed_content', 'is', null)
    .or('parsed_content.ilike.%평가%,parsed_content.ilike.%배점%,parsed_content.ilike.%심사%')
    .eq('status', 'active')
    .limit(3)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('=== 평가기준 포함 공고 샘플 ===\n')
  
  for (const ann of data || []) {
    console.log('제목:', ann.title)
    console.log('출처:', ann.source)
    console.log('---')
    // 평가 관련 부분만 추출
    const content = ann.parsed_content || ''
    const lines = content.split('\n')
    let inEvalSection = false
    let evalContent = ''
    
    for (const line of lines) {
      if (line.includes('평가') || line.includes('심사') || line.includes('배점') || line.includes('선정기준')) {
        inEvalSection = true
      }
      if (inEvalSection) {
        evalContent += line + '\n'
        if (evalContent.length > 2000) break
      }
    }
    
    if (evalContent) {
      console.log('평가 관련 내용:')
      console.log(evalContent.substring(0, 2000))
    } else {
      console.log('parsed_content 앞부분:')
      console.log(content.substring(0, 1500))
    }
    console.log('\n' + '='.repeat(80) + '\n')
  }
}

getSamples()

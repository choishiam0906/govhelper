import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getSamples() {
  // 배점이 포함된 공고 샘플 조회
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, source, parsed_content')
    .not('parsed_content', 'is', null)
    .or('parsed_content.ilike.%배점%,parsed_content.ilike.%점수%,parsed_content.ilike.%100점%')
    .eq('status', 'active')
    .limit(5)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('=== 배점 정보 포함 공고 ===\n')
  console.log('총', data?.length, '건 발견\n')
  
  for (const ann of (data || []).slice(0, 2)) {
    console.log('제목:', ann.title)
    console.log('출처:', ann.source)
    console.log('---')
    const content = ann.parsed_content || ''
    console.log('내용 (앞 3000자):')
    console.log(content.substring(0, 3000))
    console.log('\n' + '='.repeat(80) + '\n')
  }
}

getSamples()

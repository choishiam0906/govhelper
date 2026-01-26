import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getSamples() {
  // 긴 parsed_content를 가진 공고 (첨부파일 내용이 많이 추출된 것)
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, source, parsed_content')
    .not('parsed_content', 'is', null)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error:', error)
    return
  }

  // 길이순 정렬
  const sorted = (data || [])
    .map(a => ({ ...a, length: a.parsed_content?.length || 0 }))
    .sort((a, b) => b.length - a.length)
    .slice(0, 3)

  console.log('=== 가장 긴 parsed_content 공고 ===\n')
  
  for (const ann of sorted) {
    console.log('제목:', ann.title)
    console.log('출처:', ann.source)
    console.log('내용 길이:', ann.length, '자')
    console.log('---')
    const content = ann.parsed_content || ''
    
    // 평가, 심사, 선정 관련 키워드 검색
    const keywords = ['평가기준', '평가항목', '심사기준', '선정기준', '배점', '가점', '감점']
    for (const kw of keywords) {
      if (content.includes(kw)) {
        const idx = content.indexOf(kw)
        console.log(`[${kw}] 발견 위치: ${idx}`)
        console.log('주변 내용:', content.substring(Math.max(0, idx - 50), idx + 500))
        console.log('---')
      }
    }
    
    console.log('\n' + '='.repeat(80) + '\n')
  }
}

getSamples()

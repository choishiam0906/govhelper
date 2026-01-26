import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getSamples() {
  // R&D나 기술개발 사업 중 첨부파일 파싱된 것
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, source, parsed_content')
    .not('parsed_content', 'is', null)
    .ilike('title', '%기술개발%')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('=== R&D/기술개발 사업 공고 ===\n')
  
  for (const ann of data || []) {
    console.log('제목:', ann.title)
    console.log('출처:', ann.source)
    console.log('내용 길이:', ann.parsed_content?.length || 0, '자')
    console.log('---')
    const content = ann.parsed_content || ''
    // 첨부파일 내용 부분 확인
    if (content.includes('## 첨부파일 내용')) {
      const attachmentPart = content.split('## 첨부파일 내용')[1] || ''
      console.log('첨부파일 내용 (앞 4000자):')
      console.log(attachmentPart.substring(0, 4000))
    } else {
      console.log('내용 (앞 3000자):')
      console.log(content.substring(0, 3000))
    }
    console.log('\n' + '='.repeat(80) + '\n')
  }
}

getSamples()

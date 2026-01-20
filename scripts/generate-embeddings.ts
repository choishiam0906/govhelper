import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as crypto from 'crypto'
import * as dotenv from 'dotenv'

// .env.local 파일 로드
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!

if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
  console.error('환경변수가 설정되지 않았어요')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  console.log('GOOGLE_GENERATIVE_AI_API_KEY:', !!geminiApiKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const genAI = new GoogleGenerativeAI(geminiApiKey)

const BATCH_SIZE = 10
const DELAY_MS = 1000

function generateHash(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex')
}

function prepareEmbeddingText(announcement: {
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  target_company: string | null
  content: string | null
  parsed_content: string | null
}): string {
  const parts = [
    `제목: ${announcement.title}`,
    announcement.organization ? `기관: ${announcement.organization}` : '',
    announcement.category ? `분야: ${announcement.category}` : '',
    announcement.support_type ? `지원유형: ${announcement.support_type}` : '',
    announcement.target_company ? `지원대상: ${announcement.target_company}` : '',
    announcement.parsed_content || announcement.content || '',
  ]

  return parts.filter(Boolean).join('\n').slice(0, 10000)
}

async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
  const result = await model.embedContent(text)
  return result.embedding.values
}

async function main() {
  console.log('🚀 공고 벡터화 시작...\n')

  // 공고 조회
  const { data: announcements, error: fetchError } = await supabase
    .from('announcements')
    .select('id, title, organization, category, support_type, target_company, content, parsed_content')
    .eq('status', 'active')

  if (fetchError) {
    console.error('공고 조회 오류:', fetchError)
    process.exit(1)
  }

  console.log(`📋 총 ${announcements?.length || 0}개 공고 발견\n`)

  if (!announcements || announcements.length === 0) {
    console.log('벡터화할 공고가 없어요')
    process.exit(0)
  }

  // 기존 임베딩 조회
  const { data: existingEmbeddings } = await supabase
    .from('announcement_embeddings')
    .select('announcement_id, content_hash')

  const existingMap = new Map(
    existingEmbeddings?.map((e: any) => [e.announcement_id, e.content_hash]) || []
  )

  console.log(`📊 기존 임베딩: ${existingMap.size}개\n`)

  let processed = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < announcements.length; i += BATCH_SIZE) {
    const batch = announcements.slice(i, i + BATCH_SIZE)

    for (const announcement of batch) {
      try {
        const text = prepareEmbeddingText(announcement)
        const contentHash = generateHash(text)

        // 변경되지 않은 경우 스킵
        if (existingMap.get(announcement.id) === contentHash) {
          skipped++
          continue
        }

        // 임베딩 생성
        const embedding = await generateEmbedding(text)

        // Supabase에 저장
        const { error: upsertError } = await supabase
          .from('announcement_embeddings')
          .upsert({
            announcement_id: announcement.id,
            embedding: `[${embedding.join(',')}]`,
            content_hash: contentHash,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'announcement_id',
          })

        if (upsertError) {
          console.error(`❌ ${announcement.id}: ${upsertError.message}`)
          errors++
          continue
        }

        processed++
        console.log(`✅ [${processed}/${announcements.length - skipped}] ${announcement.title.slice(0, 50)}...`)

        // Rate Limit 방지
        await new Promise(resolve => setTimeout(resolve, DELAY_MS))
      } catch (error) {
        console.error(`❌ ${announcement.id}: ${error}`)
        errors++
      }
    }

    // 배치 간 진행 상황
    console.log(`\n📈 진행: ${i + batch.length}/${announcements.length} (처리: ${processed}, 스킵: ${skipped}, 오류: ${errors})\n`)
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 벡터화 완료!')
  console.log(`   처리됨: ${processed}개`)
  console.log(`   스킵됨: ${skipped}개 (변경 없음)`)
  console.log(`   오류: ${errors}개`)
  console.log('='.repeat(50))
}

main().catch(console.error)

/**
 * Supabase 마이그레이션 실행 스크립트 - 015_application_tracking
 *
 * 사용법: npx tsx scripts/run-migration-015.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// 환경변수 로드
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('환경변수가 설정되지 않았습니다.')
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요')
  process.exit(1)
}

// 마이그레이션 파일 경로
const MIGRATION_FILE = path.join(__dirname, '..', 'supabase', 'migrations', '015_application_tracking.sql')

async function runMigration() {
  console.log('========================================')
  console.log('Supabase 마이그레이션 실행')
  console.log('015_application_tracking.sql')
  console.log('========================================')

  // SQL 파일 읽기
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error(`마이그레이션 파일을 찾을 수 없습니다: ${MIGRATION_FILE}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(MIGRATION_FILE, 'utf-8')
  console.log(`\n마이그레이션 파일: ${MIGRATION_FILE}`)
  console.log(`SQL 길이: ${sql.length} 문자`)

  // Supabase 클라이언트 생성
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // SQL 실행 (여러 문장으로 분리)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`\n실행할 SQL 문: ${statements.length}개`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]

    // COMMENT 문은 건너뛰기
    if (statement.toUpperCase().startsWith('COMMENT')) {
      console.log(`  [${i + 1}/${statements.length}] COMMENT 건너뜀`)
      continue
    }

    try {
      // rpc를 통해 SQL 실행
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' })

      if (error) {
        // exec_sql 함수가 없으면 직접 실행 시도
        if (error.message.includes('function') || error.message.includes('does not exist')) {
          throw new Error('exec_sql 함수가 없습니다. Supabase 대시보드에서 직접 실행해주세요.')
        }
        throw error
      }

      console.log(`  [${i + 1}/${statements.length}] 성공`)
      successCount++
    } catch (err: any) {
      console.error(`  [${i + 1}/${statements.length}] 실패: ${err.message}`)
      errorCount++

      // 치명적 오류면 중단
      if (err.message.includes('대시보드에서')) {
        console.log('\n========================================')
        console.log('Supabase 대시보드에서 직접 SQL을 실행해주세요.')
        console.log('========================================')
        console.log('\n1. https://supabase.com/dashboard 접속')
        console.log('2. 프로젝트 선택 → SQL Editor')
        console.log('3. 아래 파일 내용 복사하여 실행:')
        console.log(`   ${MIGRATION_FILE}`)
        console.log('\n또는 아래 SQL을 직접 복사하여 실행:')
        console.log('----------------------------------------')
        console.log(sql)
        console.log('----------------------------------------')
        process.exit(1)
      }
    }
  }

  console.log('\n========================================')
  console.log(`완료! 성공: ${successCount}, 실패: ${errorCount}`)
  console.log('========================================')
}

runMigration().catch(console.error)

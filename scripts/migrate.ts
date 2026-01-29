/**
 * Supabase 마이그레이션 자동화 스크립트
 *
 * 사용법:
 *   npx tsx scripts/migrate.ts              # 미실행 마이그레이션 순서대로 실행
 *   npx tsx scripts/migrate.ts --status     # 마이그레이션 상태 확인
 *   npx tsx scripts/migrate.ts --file 035   # 특정 파일만 실행
 *   npx tsx scripts/migrate.ts --create 이름 # 새 마이그레이션 파일 생성
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import 'dotenv/config'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('환경변수가 필요해요: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// 마이그레이션 파일 목록 (번호순 정렬)
function getMigrationFiles(): { name: string; path: string; number: number }[] {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  return files.map(f => ({
    name: f.replace('.sql', ''),
    path: path.join(MIGRATIONS_DIR, f),
    number: parseInt(f.split('_')[0], 10)
  }))
}

// 파일 체크섬 계산
function getChecksum(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8')
  return crypto.createHash('md5').update(content).digest('hex')
}

// 실행된 마이그레이션 목록 조회
async function getExecutedMigrations(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('_migrations')
    .select('name')
    .eq('success', true)

  if (error) {
    // 테이블이 없으면 빈 셋 반환 (첫 실행)
    if (error.message.includes('does not exist') || error.code === '42P01') {
      return new Set()
    }
    throw error
  }

  return new Set((data || []).map(r => r.name))
}

// SQL 실행
async function executeSql(sql: string): Promise<void> {
  // 문장별 분리 실행
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    if (statement.toUpperCase().startsWith('COMMENT')) continue

    const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' })
    if (error) {
      throw new Error(`SQL 실행 실패: ${error.message}\n문장: ${statement.substring(0, 100)}...`)
    }
  }
}

// 마이그레이션 기록
async function recordMigration(name: string, checksum: string, success: boolean): Promise<void> {
  await supabase.from('_migrations').upsert({
    name,
    checksum,
    success,
    executed_at: new Date().toISOString()
  }, { onConflict: 'name' })
}

// 미실행 마이그레이션 실행
async function runPendingMigrations(): Promise<void> {
  console.log('마이그레이션 상태를 확인하고 있어요...\n')

  const executed = await getExecutedMigrations()
  const files = getMigrationFiles()
  const pending = files.filter(f => !executed.has(f.name))

  if (pending.length === 0) {
    console.log('모든 마이그레이션이 이미 실행됐어요!')
    return
  }

  console.log(`실행 대기 중인 마이그레이션: ${pending.length}개\n`)

  let successCount = 0
  let errorCount = 0

  for (const migration of pending) {
    const checksum = getChecksum(migration.path)
    console.log(`> ${migration.name}...`)

    try {
      const sql = fs.readFileSync(migration.path, 'utf-8')
      await executeSql(sql)
      await recordMigration(migration.name, checksum, true)
      console.log(`  성공`)
      successCount++
    } catch (err: any) {
      console.error(`  실패: ${err.message}`)
      await recordMigration(migration.name, checksum, false)
      errorCount++

      if (err.message.includes('exec_sql')) {
        console.log('\nexec_sql 함수가 없어요.')
        console.log('먼저 038_migration_tracking.sql을 Supabase 대시보드에서 실행해주세요.')
        console.log('  1. https://supabase.com/dashboard -> SQL Editor')
        console.log(`  2. ${path.join(MIGRATIONS_DIR, '038_migration_tracking.sql')} 내용 실행`)
        break
      }
    }
  }

  console.log(`\n결과: 성공 ${successCount}개, 실패 ${errorCount}개`)
}

// 상태 확인
async function showStatus(): Promise<void> {
  console.log('마이그레이션 상태\n')

  const executed = await getExecutedMigrations()
  const files = getMigrationFiles()

  const maxNameLen = Math.max(...files.map(f => f.name.length))

  for (const file of files) {
    const status = executed.has(file.name) ? '[완료]' : '[대기]'
    console.log(`  ${status} ${file.name.padEnd(maxNameLen + 2)}`)
  }

  const pendingCount = files.filter(f => !executed.has(f.name)).length
  console.log(`\n총 ${files.length}개 중 ${files.length - pendingCount}개 실행됨, ${pendingCount}개 대기`)
}

// 특정 파일 실행
async function runSpecificFile(fileNumber: string): Promise<void> {
  const files = getMigrationFiles()
  const target = files.find(f => f.name.startsWith(fileNumber.padStart(3, '0')))

  if (!target) {
    console.error(`${fileNumber}번 마이그레이션 파일을 찾을 수 없어요`)
    process.exit(1)
  }

  console.log(`> ${target.name} 실행 중...`)
  const sql = fs.readFileSync(target.path, 'utf-8')
  const checksum = getChecksum(target.path)

  try {
    await executeSql(sql)
    await recordMigration(target.name, checksum, true)
    console.log('성공!')
  } catch (err: any) {
    console.error(`실패: ${err.message}`)
    await recordMigration(target.name, checksum, false)
  }
}

// 새 마이그레이션 파일 생성
function createMigration(name: string): void {
  const files = getMigrationFiles()
  const lastNumber = files.length > 0 ? Math.max(...files.map(f => f.number)) : 0
  const nextNumber = String(lastNumber + 1).padStart(3, '0')
  const fileName = `${nextNumber}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`
  const filePath = path.join(MIGRATIONS_DIR, fileName)

  const template = `-- 마이그레이션: ${name}
-- 생성일: ${new Date().toISOString().split('T')[0]}

-- TODO: SQL 작성

`

  fs.writeFileSync(filePath, template, 'utf-8')
  console.log(`새 마이그레이션 파일을 생성했어요: ${fileName}`)
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--status')) {
    await showStatus()
  } else if (args.includes('--file')) {
    const idx = args.indexOf('--file')
    const fileNumber = args[idx + 1]
    if (!fileNumber) {
      console.error('파일 번호를 입력해주세요: --file 035')
      process.exit(1)
    }
    await runSpecificFile(fileNumber)
  } else if (args.includes('--create')) {
    const idx = args.indexOf('--create')
    const name = args.slice(idx + 1).join(' ')
    if (!name) {
      console.error('마이그레이션 이름을 입력해주세요: --create 테이블_추가')
      process.exit(1)
    }
    createMigration(name)
  } else {
    await runPendingMigrations()
  }
}

main().catch(err => {
  console.error('오류 발생:', err.message)
  process.exit(1)
})

/**
 * 국민연금 사업장 데이터 Import 스크립트
 *
 * 사용법:
 * 1. https://www.data.go.kr/data/15083277/fileData.do 에서 CSV 다운로드
 * 2. 다운로드한 파일을 scripts/data/nps_business.csv 로 저장
 * 3. npx tsx scripts/import-nps-data.ts 실행
 *
 * 환경변수 필요:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

// 환경변수 로드
import 'dotenv/config'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('환경변수가 설정되지 않았습니다.')
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// CSV 파일 경로
const CSV_FILE_PATH = path.join(__dirname, 'data', 'nps_business.csv')

// 배치 크기 (한 번에 insert할 행 수)
const BATCH_SIZE = 1000

// 진행 상황 출력 간격
const PROGRESS_INTERVAL = 10000

interface NpsBusinessRecord {
  business_number: string
  company_name: string
  road_address: string | null
  jibun_address: string | null
  postal_code: string | null
  subscriber_count: number
  monthly_payment: number
  new_subscribers: number
  lost_subscribers: number
  data_year_month: string
}

/**
 * CSV 라인 파싱 (따옴표 처리 포함)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

/**
 * 사업자번호 정규화 (하이픈 제거, 10자리)
 */
function normalizeBusinessNumber(bizNum: string): string | null {
  const cleaned = bizNum.replace(/[^0-9]/g, '')
  if (cleaned.length !== 10) return null
  return cleaned
}

/**
 * 숫자 파싱 (빈 값은 0)
 */
function parseNumber(value: string): number {
  const num = parseInt(value.replace(/,/g, ''), 10)
  return isNaN(num) ? 0 : num
}

/**
 * CSV 파일을 스트림으로 읽어서 Supabase에 저장
 */
async function importCSV() {
  console.log('========================================')
  console.log('국민연금 사업장 데이터 Import 시작')
  console.log('========================================')

  // 파일 존재 확인
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`\n파일을 찾을 수 없습니다: ${CSV_FILE_PATH}`)
    console.log('\n다음 단계를 따라주세요:')
    console.log('1. https://www.data.go.kr/data/15083277/fileData.do 접속')
    console.log('2. CSV 파일 다운로드')
    console.log(`3. 다운로드한 파일을 ${CSV_FILE_PATH}로 저장`)
    console.log('4. 스크립트 다시 실행')
    process.exit(1)
  }

  // 기존 데이터 삭제 여부 확인
  const { count: existingCount } = await supabase
    .from('nps_business_registry')
    .select('*', { count: 'exact', head: true })

  if (existingCount && existingCount > 0) {
    console.log(`\n기존 데이터 ${existingCount.toLocaleString()}건이 있습니다.`)
    console.log('기존 데이터를 삭제하고 새로 import합니다...')

    const { error: deleteError } = await supabase
      .from('nps_business_registry')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 행 삭제

    if (deleteError) {
      console.error('기존 데이터 삭제 실패:', deleteError)
      process.exit(1)
    }
    console.log('기존 데이터 삭제 완료')
  }

  // 파일 스트림 생성
  const fileStream = fs.createReadStream(CSV_FILE_PATH, { encoding: 'utf-8' })
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })

  let lineNumber = 0
  let headerParsed = false
  let columnIndices: Record<string, number> = {}
  let batch: NpsBusinessRecord[] = []
  let totalInserted = 0
  let skippedCount = 0

  const startTime = Date.now()

  console.log('\nCSV 파일 읽기 시작...')

  for await (const line of rl) {
    lineNumber++

    // 빈 줄 건너뛰기
    if (!line.trim()) continue

    const columns = parseCSVLine(line)

    // 헤더 파싱 (첫 번째 줄)
    if (!headerParsed) {
      // 컬럼 인덱스 매핑
      columns.forEach((col, idx) => {
        const normalizedCol = col.replace(/\s/g, '').toLowerCase()

        if (normalizedCol.includes('자료생성년월') || normalizedCol.includes('data_year_month')) {
          columnIndices.dataYearMonth = idx
        } else if (normalizedCol.includes('사업자등록번호') || normalizedCol.includes('bzowr_rgst_no')) {
          columnIndices.businessNumber = idx
        } else if (normalizedCol.includes('사업장명') || normalizedCol.includes('wkpl_nm')) {
          columnIndices.companyName = idx
        } else if (normalizedCol.includes('우편번호') || normalizedCol.includes('postal')) {
          columnIndices.postalCode = idx
        } else if (normalizedCol.includes('지번') || normalizedCol.includes('jibun')) {
          columnIndices.jibunAddress = idx
        } else if (normalizedCol.includes('도로명') || normalizedCol.includes('road')) {
          columnIndices.roadAddress = idx
        } else if (normalizedCol.includes('가입자') || normalizedCol.includes('subscriber')) {
          columnIndices.subscriberCount = idx
        } else if (normalizedCol.includes('당월고지') || normalizedCol.includes('payment')) {
          columnIndices.monthlyPayment = idx
        } else if (normalizedCol.includes('신규취득') || normalizedCol.includes('new')) {
          columnIndices.newSubscribers = idx
        } else if (normalizedCol.includes('상실') || normalizedCol.includes('lost')) {
          columnIndices.lostSubscribers = idx
        }
      })

      console.log('\n컬럼 매핑 완료:')
      console.log(columnIndices)

      // 필수 컬럼 확인
      if (columnIndices.businessNumber === undefined || columnIndices.companyName === undefined) {
        console.error('\n필수 컬럼을 찾을 수 없습니다: 사업자등록번호, 사업장명')
        console.log('CSV 컬럼:', columns)
        process.exit(1)
      }

      headerParsed = true
      continue
    }

    // 데이터 행 처리
    const businessNumber = normalizeBusinessNumber(columns[columnIndices.businessNumber] || '')

    if (!businessNumber) {
      skippedCount++
      continue
    }

    const record: NpsBusinessRecord = {
      business_number: businessNumber,
      company_name: columns[columnIndices.companyName] || '',
      road_address: columns[columnIndices.roadAddress] || null,
      jibun_address: columns[columnIndices.jibunAddress] || null,
      postal_code: columns[columnIndices.postalCode] || null,
      subscriber_count: parseNumber(columns[columnIndices.subscriberCount] || '0'),
      monthly_payment: parseNumber(columns[columnIndices.monthlyPayment] || '0'),
      new_subscribers: parseNumber(columns[columnIndices.newSubscribers] || '0'),
      lost_subscribers: parseNumber(columns[columnIndices.lostSubscribers] || '0'),
      data_year_month: columns[columnIndices.dataYearMonth] || '',
    }

    batch.push(record)

    // 배치 크기에 도달하면 DB에 저장
    if (batch.length >= BATCH_SIZE) {
      const { error } = await supabase
        .from('nps_business_registry')
        .upsert(batch, {
          onConflict: 'business_number',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error(`\n배치 저장 실패 (라인 ${lineNumber}):`, error.message)
      } else {
        totalInserted += batch.length
      }

      batch = []

      // 진행 상황 출력
      if (totalInserted % PROGRESS_INTERVAL === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(`  ${totalInserted.toLocaleString()}건 저장 완료 (${elapsed}초 경과)`)
      }
    }
  }

  // 남은 배치 저장
  if (batch.length > 0) {
    const { error } = await supabase
      .from('nps_business_registry')
      .upsert(batch, {
        onConflict: 'business_number',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('\n마지막 배치 저장 실패:', error.message)
    } else {
      totalInserted += batch.length
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n========================================')
  console.log('Import 완료!')
  console.log('========================================')
  console.log(`총 처리 라인: ${(lineNumber - 1).toLocaleString()}`)
  console.log(`저장된 레코드: ${totalInserted.toLocaleString()}`)
  console.log(`건너뛴 레코드: ${skippedCount.toLocaleString()}`)
  console.log(`소요 시간: ${totalTime}초`)
  console.log('========================================')
}

// 실행
importCSV().catch(console.error)

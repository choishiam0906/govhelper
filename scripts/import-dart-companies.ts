/**
 * DART 기업 데이터 수집 스크립트
 *
 * 1. DART API로 전체 기업 고유번호 목록 다운로드 (ZIP)
 * 2. 각 기업별 기업개황 API 호출
 * 3. Supabase에 저장
 *
 * 사용법: npx tsx scripts/import-dart-companies.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'

// 환경변수 로드
import { config } from 'dotenv'
config({ path: '.env.local' })

const DART_API_KEY = process.env.DART_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!DART_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('환경변수가 설정되지 않았습니다.')
  console.error('필수 환경변수:')
  console.error('  - DART_API_KEY: DART API 키 (https://opendart.fss.or.kr 에서 발급)')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL: Supabase 프로젝트 URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY: Supabase 서비스 역할 키')
  console.error('')
  console.error('.env.local 파일에 위 환경변수를 설정하세요.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL.trim(), SUPABASE_SERVICE_KEY.trim())

// 설정
const DATA_DIR = path.join(__dirname, 'data')
const CORP_CODE_ZIP = path.join(DATA_DIR, 'CORPCODE.zip')
const CORP_CODE_XML = path.join(DATA_DIR, 'CORPCODE.xml')
const BATCH_SIZE = 100 // DB 저장 배치 크기
const API_DELAY = 100 // API 호출 간 딜레이 (ms)
const PROGRESS_INTERVAL = 500 // 진행 상황 출력 간격

interface CorpCode {
  corp_code: string
  corp_name: string
  stock_code: string
  modify_date: string
}

interface CompanyInfo {
  corp_code: string
  corp_name: string
  corp_name_eng: string | null
  stock_name: string | null
  stock_code: string | null
  ceo_nm: string | null
  corp_cls: string | null
  jurir_no: string | null
  bizr_no: string | null
  adres: string | null
  hm_url: string | null
  ir_url: string | null
  phn_no: string | null
  fax_no: string | null
  induty_code: string | null
  est_dt: string | null
  acc_mt: string | null
}

/**
 * DART 고유번호 목록 다운로드
 */
async function downloadCorpCodeList(): Promise<void> {
  console.log('\n[1/4] DART 고유번호 목록 다운로드 중...')

  const url = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${DART_API_KEY}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`다운로드 실패: ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  fs.writeFileSync(CORP_CODE_ZIP, Buffer.from(buffer))

  console.log(`  ZIP 파일 저장: ${CORP_CODE_ZIP}`)
  console.log(`  파일 크기: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`)
}

/**
 * ZIP 압축 해제 및 XML 파싱
 */
function parseCorpCodeXml(): CorpCode[] {
  console.log('\n[2/4] ZIP 압축 해제 및 XML 파싱 중...')

  // ZIP 압축 해제
  const zip = new AdmZip(CORP_CODE_ZIP)
  zip.extractAllTo(DATA_DIR, true)

  // XML 파싱
  const xmlContent = fs.readFileSync(CORP_CODE_XML, 'utf-8')
  const parser = new XMLParser()
  const result = parser.parse(xmlContent)

  const corpList: CorpCode[] = result.result.list
  console.log(`  총 ${corpList.length.toLocaleString()}개 기업 발견`)

  return corpList
}

/**
 * 기업개황 API 호출
 */
async function fetchCompanyInfo(corpCode: string): Promise<CompanyInfo | null> {
  const url = `https://opendart.fss.or.kr/api/company.json?crtfc_key=${DART_API_KEY}&corp_code=${corpCode}`

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()

    if (data.status !== '000') {
      // 정상 응답이 아닌 경우 (조회 불가 등)
      return null
    }

    return data as CompanyInfo
  } catch {
    return null
  }
}

/**
 * 사업자번호 정규화 (하이픈 제거, 10자리)
 */
function normalizeBusinessNumber(bizNo: string | null): string | null {
  if (!bizNo) return null
  const cleaned = bizNo.replace(/[^0-9]/g, '')
  return cleaned.length === 10 ? cleaned : null
}

/**
 * 날짜 문자열을 Date로 변환
 */
function parseDate(dateStr: string | null): string | null {
  if (!dateStr || dateStr.length !== 8) return null
  // YYYYMMDD -> YYYY-MM-DD
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('========================================')
  console.log('DART 기업 데이터 수집 시작')
  console.log('========================================')

  // 데이터 디렉토리 생성
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }

  // 1. 고유번호 목록 다운로드
  await downloadCorpCodeList()

  // 2. XML 파싱
  const corpList = parseCorpCodeXml()

  // 3. 기업개황 조회 및 DB 저장
  console.log('\n[3/4] 기업개황 조회 및 DB 저장 중...')
  console.log(`  (${corpList.length.toLocaleString()}개 기업 처리 예정)`)

  const startTime = Date.now()
  let batch: any[] = []
  let processed = 0
  let saved = 0
  let skipped = 0
  let errors = 0

  for (const corp of corpList) {
    processed++

    // API 호출
    const info = await fetchCompanyInfo(corp.corp_code)

    if (!info) {
      skipped++
    } else {
      const bizNo = normalizeBusinessNumber(info.bizr_no)

      // 사업자번호가 없으면 저장하지 않음 (조회 불가)
      if (!bizNo) {
        skipped++
      } else {
        batch.push({
          corp_code: info.corp_code,
          corp_name: info.corp_name,
          corp_name_eng: info.corp_name_eng || null,
          stock_name: info.stock_name || null,
          stock_code: info.stock_code || null,
          business_number: bizNo,
          corp_reg_number: info.jurir_no || null,
          ceo_name: info.ceo_nm || null,
          corp_cls: info.corp_cls || null,
          address: info.adres || null,
          homepage: info.hm_url || null,
          phone: info.phn_no || null,
          fax: info.fax_no || null,
          industry_code: info.induty_code || null,
          established_date: parseDate(info.est_dt),
          accounting_month: info.acc_mt || null,
          data_updated_at: new Date().toISOString(),
        })
      }
    }

    // 배치 저장
    if (batch.length >= BATCH_SIZE) {
      const { error } = await supabase
        .from('dart_companies')
        .upsert(batch, {
          onConflict: 'corp_code',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error(`\n  배치 저장 실패: ${error.message}`)
        errors += batch.length
      } else {
        saved += batch.length
      }

      batch = []
    }

    // 진행 상황 출력
    if (processed % PROGRESS_INTERVAL === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
      const percent = ((processed / corpList.length) * 100).toFixed(1)
      const rate = (processed / parseFloat(elapsed)).toFixed(1)
      console.log(`  ${processed.toLocaleString()}/${corpList.length.toLocaleString()} (${percent}%) - ${elapsed}초 경과, ${rate}건/초`)
    }

    // API Rate Limit 방지
    await new Promise((resolve) => setTimeout(resolve, API_DELAY))
  }

  // 남은 배치 저장
  if (batch.length > 0) {
    const { error } = await supabase
      .from('dart_companies')
      .upsert(batch, {
        onConflict: 'corp_code',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`\n  마지막 배치 저장 실패: ${error.message}`)
      errors += batch.length
    } else {
      saved += batch.length
    }
  }

  // 4. 완료
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n[4/4] 완료!')
  console.log('\n========================================')
  console.log('DART 기업 데이터 수집 완료')
  console.log('========================================')
  console.log(`처리된 기업: ${processed.toLocaleString()}`)
  console.log(`저장된 기업: ${saved.toLocaleString()}`)
  console.log(`건너뛴 기업: ${skipped.toLocaleString()} (사업자번호 없음)`)
  console.log(`오류: ${errors.toLocaleString()}`)
  console.log(`소요 시간: ${totalTime}초`)
  console.log('========================================')
}

// 실행
main().catch(console.error)

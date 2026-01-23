// KSIC (한국표준산업분류) 데이터 import 스크립트
// 사용법: npx tsx scripts/import-ksic-data.ts

import { createClient } from '@supabase/supabase-js'
import * as zlib from 'zlib'
import * as https from 'https'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경변수가 설정되지 않았습니다.')
  console.error('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 중분류 → 대분류 매핑
const MAJOR_CATEGORY_MAP: Record<string, string> = {
  '01': 'A', '02': 'A', '03': 'A',
  '05': 'B', '06': 'B', '07': 'B', '08': 'B',
  '10': 'C', '11': 'C', '12': 'C', '13': 'C', '14': 'C', '15': 'C', '16': 'C', '17': 'C',
  '18': 'C', '19': 'C', '20': 'C', '21': 'C', '22': 'C', '23': 'C', '24': 'C', '25': 'C',
  '26': 'C', '27': 'C', '28': 'C', '29': 'C', '30': 'C', '31': 'C', '32': 'C', '33': 'C', '34': 'C',
  '35': 'D',
  '36': 'E', '37': 'E', '38': 'E', '39': 'E',
  '41': 'F', '42': 'F',
  '45': 'G', '46': 'G', '47': 'G',
  '49': 'H', '50': 'H', '51': 'H', '52': 'H',
  '55': 'I', '56': 'I',
  '58': 'J', '59': 'J', '60': 'J', '61': 'J', '62': 'J', '63': 'J',
  '64': 'K', '65': 'K', '66': 'K',
  '68': 'L',
  '70': 'M', '71': 'M', '72': 'M', '73': 'M',
  '74': 'N', '75': 'N', '76': 'N',
  '84': 'O',
  '85': 'P',
  '86': 'Q', '87': 'Q', '88': 'Q',
  '90': 'R', '91': 'R',
  '94': 'S', '95': 'S', '96': 'S',
  '97': 'T', '98': 'T',
  '99': 'U',
}

function getCodeLevel(code: string): number {
  if (/^[A-U]$/.test(code)) return 1
  if (/^[0-9]{2}$/.test(code)) return 2
  if (/^[0-9]{3}$/.test(code)) return 3
  if (/^[0-9]{4}$/.test(code)) return 4
  if (/^[0-9]{5}$/.test(code)) return 5
  return 0
}

function getParentCode(code: string, level: number): string | null {
  switch (level) {
    case 1: return null
    case 2: return MAJOR_CATEGORY_MAP[code] || null
    case 3: return code.substring(0, 2)
    case 4: return code.substring(0, 3)
    case 5: return code.substring(0, 4)
    default: return null
  }
}

async function fetchGzippedCSV(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 리다이렉트 처리
        const redirectUrl = response.headers.location
        if (redirectUrl) {
          fetchGzippedCSV(redirectUrl).then(resolve).catch(reject)
          return
        }
      }

      const chunks: Buffer[] = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => {
        const buffer = Buffer.concat(chunks)
        zlib.gunzip(buffer, (err, decompressed) => {
          if (err) {
            reject(err)
            return
          }
          resolve(decompressed.toString('utf-8'))
        })
      })
      response.on('error', reject)
    }).on('error', reject)
  })
}

async function importKSICData() {
  console.log('KSIC 데이터 import를 시작합니다...')

  // GitHub에서 KSIC 10차 데이터 다운로드
  const url = 'https://github.com/FinanceData/KSIC/raw/master/KSIC_10.csv.gz'

  console.log('데이터 다운로드 중...')
  let csvContent: string

  try {
    csvContent = await fetchGzippedCSV(url)
  } catch (error) {
    console.error('데이터 다운로드 실패:', error)
    console.log('로컬 기본 데이터만 사용합니다.')
    return
  }

  // CSV 파싱
  const lines = csvContent.split('\n').filter(line => line.trim())
  console.log(`총 ${lines.length}개 라인 발견`)

  // 첫 번째 라인이 헤더인지 확인
  const hasHeader = lines[0].includes('산업코드') || lines[0].includes('code')
  const dataLines = hasHeader ? lines.slice(1) : lines

  const records: Array<{
    code: string
    code_level: number
    name: string
    parent_code: string | null
  }> = []

  for (const line of dataLines) {
    const parts = line.split(',')
    if (parts.length < 2) continue

    const code = parts[0].trim().replace(/"/g, '')
    const name = parts[1].trim().replace(/"/g, '')

    if (!code || !name) continue

    const codeLevel = getCodeLevel(code)
    if (codeLevel === 0) continue

    const parentCode = getParentCode(code, codeLevel)

    records.push({
      code,
      code_level: codeLevel,
      name,
      parent_code: parentCode,
    })
  }

  console.log(`${records.length}개 레코드 파싱 완료`)

  // 배치 insert (100개씩)
  const batchSize = 100
  let inserted = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)

    const { error } = await supabase
      .from('ksic_codes')
      .upsert(batch, { onConflict: 'code' })

    if (error) {
      console.error(`배치 ${i / batchSize + 1} 삽입 실패:`, error)
    } else {
      inserted += batch.length
      console.log(`진행: ${inserted}/${records.length}`)
    }

    // Rate limit 방지
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`KSIC 데이터 import 완료: ${inserted}개 레코드`)
}

importKSICData()
  .then(() => {
    console.log('완료!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('오류 발생:', error)
    process.exit(1)
  })

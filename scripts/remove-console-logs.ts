/**
 * 프로덕션 코드에서 불필요한 console.log 제거 스크립트
 *
 * 제거 대상:
 * - console.log (디버깅용 로그)
 *
 * 유지 대상:
 * - console.error (에러 로깅)
 * - console.warn (경고)
 */

import fs from 'fs/promises'
import path from 'path'
import { glob } from 'glob'

const TARGET_DIRS = [
  'C:/Users/chois/govhelper-main/app',
  'C:/Users/chois/govhelper-main/lib',
  'C:/Users/chois/govhelper-main/components',
]

const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/scripts/**', // 스크립트 제외
  '**/__tests__/**', // 테스트 제외
]

async function removeConsoleLogs() {
  let totalFiles = 0
  let totalRemoved = 0

  for (const dir of TARGET_DIRS) {
    console.log(`\n📂 ${path.basename(dir)} 디렉토리 정리 중...`)

    // TS/TSX 파일 찾기
    const files = await glob(`${dir}/**/*.{ts,tsx}`, {
      ignore: EXCLUDE_PATTERNS,
    })

    for (const file of files) {
      try {
        let content = await fs.readFile(file, 'utf-8')
        let modified = false
        let count = 0

        // console.log 패턴 제거 (단, console.error, console.warn은 유지)
        const lines = content.split('\n')
        const newLines: string[] = []

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]

          // console.log 또는 console.info가 있는지 확인
          if (/console\.(log|info)\(/.test(line)) {
            // console.error, console.warn은 유지
            if (/console\.(error|warn)\(/.test(line)) {
              newLines.push(line)
            } else {
              // console.log 제거
              modified = true
              count++
              // 빈 줄도 제거하지 않음 (가독성 유지)
            }
          } else {
            newLines.push(line)
          }
        }

        if (modified) {
          // 파일 업데이트
          await fs.writeFile(file, newLines.join('\n'), 'utf-8')
          totalFiles++
          totalRemoved += count
          console.log(`  ✅ ${path.relative(process.cwd(), file)} (${count}개 제거)`)
        }
      } catch (error) {
        console.error(`  ❌ ${file}: ${error}`)
      }
    }
  }

  console.log(`\n✅ 정리 완료:`)
  console.log(`   - 수정된 파일: ${totalFiles}개`)
  console.log(`   - 제거된 console.log: ${totalRemoved}개`)
}

removeConsoleLogs().catch(console.error)

/**
 * Groq를 사용한 평가기준 배치 추출 스크립트
 *
 * Gemini API 할당량 초과 시 Groq (Llama 3.3 70B)로 대체 실행
 */
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!
})

const BATCH_SIZE = 5
const DELAY_BETWEEN_BATCHES = 2000
const DELAY_BETWEEN_ITEMS = 500

// 평가기준 추출 프롬프트
function getEvaluationPrompt(title: string, content: string): string {
  return `당신은 정부지원사업 평가기준 분석 전문가입니다. 아래 공고 내용에서 **평가기준(심사기준)**을 추출해주세요.

## 공고 제목
${title}

## 공고 내용
${content.substring(0, 15000)}

---

# 추출 지침

1. **평가항목 식별**: 서류심사, 발표심사 등의 평가항목과 배점을 찾아주세요.
2. **배점 추출**: 각 항목별 배점(점수)을 정확히 추출하세요.
3. **가점/감점**: 가점 항목(벤처인증, 여성기업 등)과 감점 항목을 찾아주세요.
4. **합격기준**: 합격 기준점(예: 70점 이상)이 있다면 추출하세요.

**일반적인 정부지원사업 평가 분류:**
- 기술성/기술개발역량 (기술의 혁신성, 차별성, 개발계획 적정성)
- 사업성/사업화역량 (사업화 전략, 시장 분석, 수익 모델)
- 시장성 (시장 규모, 성장성, 경쟁력)
- 정책부합도/공고부합도 (사업 목적 부합성)
- 대표자/팀 역량 (경험, 전문성)

---

# 응답 형식 (JSON만 반환)

{
  "found": true,
  "totalScore": 100,
  "passingScore": 70,
  "items": [
    {
      "category": "기술성",
      "name": "기술개발 계획의 적정성",
      "description": "기술개발 목표, 내용, 방법의 구체성 및 적정성",
      "maxScore": 30,
      "subItems": []
    }
  ],
  "bonusItems": [
    {
      "name": "벤처기업 인증",
      "score": 3,
      "condition": "벤처기업 인증서 보유",
      "type": "bonus"
    }
  ],
  "evaluationMethod": {
    "type": "absolute",
    "stages": 2,
    "stageNames": ["서류심사", "발표심사"]
  },
  "confidence": 0.85
}

**주의사항:**
- 평가기준을 찾을 수 없는 경우: { "found": false, "confidence": 0 }
- 부분적으로만 있는 경우: 찾은 내용만 포함하고 confidence를 낮게 설정
- JSON만 응답하세요. 설명이나 마크다운 없이 순수 JSON만 출력`
}

// Groq로 평가기준 추출
async function extractWithGroq(title: string, content: string) {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: getEvaluationPrompt(title, content)
        }
      ],
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    })

    const text = response.choices[0]?.message?.content || ''

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: 'JSON 파싱 실패' }
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.found) {
      return { success: false, error: '평가기준 없음' }
    }

    // 평가기준 구조화
    const criteria = {
      totalScore: parsed.totalScore || 100,
      passingScore: parsed.passingScore || null,
      items: (parsed.items || []).map((item: any) => ({
        category: item.category || '기타',
        name: item.name || '',
        description: item.description || '',
        maxScore: item.maxScore || 0,
        weight: item.weight || null,
        subItems: (item.subItems || []).map((sub: any) => ({
          name: sub.name || '',
          description: sub.description || '',
          maxScore: sub.maxScore || 0,
          keywords: sub.keywords || []
        }))
      })),
      bonusItems: (parsed.bonusItems || []).map((bonus: any) => ({
        name: bonus.name || '',
        score: bonus.score || 0,
        condition: bonus.condition || '',
        type: bonus.type || 'bonus'
      })),
      evaluationMethod: parsed.evaluationMethod ? {
        type: parsed.evaluationMethod.type || 'absolute',
        stages: parsed.evaluationMethod.stages || null,
        stageNames: parsed.evaluationMethod.stageNames || []
      } : undefined,
      extractedAt: new Date().toISOString(),
      confidence: parsed.confidence || 0.5,
      source: 'Groq Llama 3.3 70B'
    }

    return { success: true, criteria }
  } catch (error: any) {
    return { success: false, error: error.message || '알 수 없는 오류' }
  }
}

async function runEvaluationParse() {
  let totalProcessed = 0
  let totalFound = 0
  let totalNotFound = 0
  let totalFailed = 0
  let hasMore = true

  console.log('=== Groq 평가기준 배치 추출 시작 ===')
  console.log('모델: Llama 3.3 70B Versatile\n')

  while (hasMore) {
    // 파싱 필요한 공고 조회
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('id, title, content, parsed_content')
      .eq('status', 'active')
      .or('evaluation_parsed.is.null,evaluation_parsed.eq.false')
      .not('parsed_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(BATCH_SIZE)

    if (error) {
      console.error('조회 오류:', error.message)
      break
    }

    if (!announcements || announcements.length === 0) {
      hasMore = false
      break
    }

    console.log(`\n배치 처리 중: ${announcements.length}건`)
    console.log('─'.repeat(50))

    for (const ann of announcements) {
      try {
        const title = ann.title ? ann.title.substring(0, 50) : '제목없음'
        const contentToAnalyze = ann.parsed_content || ann.content || ''

        // 컨텐츠가 너무 짧으면 스킵
        if (contentToAnalyze.length < 200) {
          console.log(`  [SKIP] ${title}... (내용 부족: ${contentToAnalyze.length}자)`)
          await supabase
            .from('announcements')
            .update({
              evaluation_parsed: true,
              evaluation_parsed_at: new Date().toISOString()
            })
            .eq('id', ann.id)
          totalNotFound++
          totalProcessed++
          continue
        }

        console.log(`  [분석] ${title}...`)

        // Groq로 평가기준 추출
        const result = await extractWithGroq(ann.title, contentToAnalyze)

        if (result.success && result.criteria) {
          // DB에 결과 저장
          const { error: updateError } = await supabase
            .from('announcements')
            .update({
              evaluation_criteria: result.criteria,
              evaluation_parsed: true,
              evaluation_parsed_at: new Date().toISOString()
            })
            .eq('id', ann.id)

          if (updateError) {
            console.error(`    [실패] DB 업데이트 오류: ${updateError.message}`)
            totalFailed++
          } else {
            const itemCount = result.criteria.items?.length || 0
            const bonusCount = result.criteria.bonusItems?.length || 0
            console.log(`    [완료] 평가항목 ${itemCount}개, 가점항목 ${bonusCount}개 (신뢰도: ${Math.round((result.criteria.confidence || 0) * 100)}%)`)
            totalFound++
          }
        } else {
          // 평가기준을 찾지 못한 경우
          await supabase
            .from('announcements')
            .update({
              evaluation_parsed: true,
              evaluation_parsed_at: new Date().toISOString()
            })
            .eq('id', ann.id)
          console.log(`    [미발견] ${result.error || '평가기준 없음'}`)
          totalNotFound++
        }

        totalProcessed++

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_ITEMS))
      } catch (error: any) {
        console.error(`    [오류] 처리 실패:`, error.message)
        totalFailed++
        totalProcessed++

        // 에러 발생해도 파싱 완료로 표시 (재시도 방지)
        await supabase
          .from('announcements')
          .update({
            evaluation_parsed: true,
            evaluation_parsed_at: new Date().toISOString()
          })
          .eq('id', ann.id)
      }
    }

    console.log(`\n진행 상황: ${totalProcessed}건 처리 (발견: ${totalFound}, 미발견: ${totalNotFound}, 실패: ${totalFailed})`)

    // 배치 간 딜레이
    if (announcements.length === BATCH_SIZE) {
      console.log(`\n${DELAY_BETWEEN_BATCHES/1000}초 대기 중...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('=== Groq 평가기준 배치 추출 완료 ===')
  console.log(`총 처리: ${totalProcessed}건`)
  console.log(`평가기준 발견: ${totalFound}건`)
  console.log(`평가기준 없음: ${totalNotFound}건`)
  console.log(`실패: ${totalFailed}건`)
  console.log('='.repeat(50))
}

runEvaluationParse().catch(console.error)

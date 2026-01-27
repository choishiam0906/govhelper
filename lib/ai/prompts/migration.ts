/**
 * 기존 프롬프트를 버전 시스템으로 마이그레이션
 *
 * lib/ai/prompts.ts의 프롬프트들을 prompt_versions 테이블로 이관
 */

import {
  MATCHING_ANALYSIS_PROMPT,
  ELIGIBILITY_PARSING_PROMPT,
  APPLICATION_SECTION_PROMPT,
  SECTION_IMPROVEMENT_PROMPT,
  EVALUATION_EXTRACTION_PROMPT,
  CHATBOT_PROMPT,
} from '../prompts'
import type { PromptType } from './versions'

/**
 * 마이그레이션 데이터 정의
 */
export const PROMPT_MIGRATIONS = [
  {
    type: 'matching_analysis' as PromptType,
    version: 'v1',
    description: '기존 매칭 분석 프롬프트 (2-단계 평가: 자격조건 + 적합도 점수)',
    contentGenerator: MATCHING_ANALYSIS_PROMPT,
    isActive: true,
    weight: 100,
  },
  {
    type: 'eligibility_parsing' as PromptType,
    version: 'v1',
    description: '기존 지원자격 파싱 프롬프트 (Few-shot 예시 포함)',
    contentGenerator: ELIGIBILITY_PARSING_PROMPT,
    isActive: true,
    weight: 100,
  },
  {
    type: 'application_section' as PromptType,
    version: 'v1',
    description: '기존 지원서 섹션 작성 프롬프트 (평가기준 기반)',
    contentGenerator: APPLICATION_SECTION_PROMPT,
    isActive: true,
    weight: 100,
  },
  {
    type: 'section_improvement' as PromptType,
    version: 'v1',
    description: '기존 섹션 개선 프롬프트 (키워드 매칭 중심)',
    contentGenerator: SECTION_IMPROVEMENT_PROMPT,
    isActive: true,
    weight: 100,
  },
  {
    type: 'evaluation_extraction' as PromptType,
    version: 'v1',
    description: '기존 평가기준 추출 프롬프트',
    contentGenerator: EVALUATION_EXTRACTION_PROMPT,
    isActive: true,
    weight: 100,
  },
  {
    type: 'chatbot' as PromptType,
    version: 'v1',
    description: '기존 챗봇 프롬프트',
    contentGenerator: CHATBOT_PROMPT,
    isActive: true,
    weight: 100,
  },
]

/**
 * 프롬프트 함수를 문자열로 직렬화
 */
export function serializePromptFunction(fn: Function): string {
  return fn.toString()
}

/**
 * 마이그레이션 스크립트 실행을 위한 헬퍼
 * (실제 실행은 별도 스크립트에서 수행)
 */
export function getMigrationSQL(): string {
  let sql = `-- AI 프롬프트 마이그레이션 SQL\n\n`

  for (const migration of PROMPT_MIGRATIONS) {
    const contentStr = serializePromptFunction(migration.contentGenerator)
      .replace(/'/g, "''") // SQL 이스케이프

    sql += `INSERT INTO prompt_versions (prompt_type, version, content, is_active, weight, description)
VALUES (
  '${migration.type}',
  '${migration.version}',
  '${contentStr}',
  ${migration.isActive},
  ${migration.weight},
  '${migration.description}'
)
ON CONFLICT (prompt_type, version) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  updated_at = now();

`
  }

  return sql
}

/**
 * 프롬프트 타입별 기본 인자 예시
 */
export const PROMPT_ARGUMENT_EXAMPLES = {
  matching_analysis: [
    '공고 내용 예시...',
    '기업 프로필 예시...',
    '사업계획서 요약 예시...',
  ],
  eligibility_parsing: [
    '2024 R&D 지원사업',
    '지원 대상: 중소기업...',
    null,
  ],
  application_section: [
    '사업 개요',
    '공고 내용...',
    '기업 프로필...',
    '사업계획서...',
  ],
  section_improvement: [
    '사업 개요',
    '현재 내용...',
    '공고 내용...',
    '기업 프로필...',
  ],
  evaluation_extraction: [
    '2024 R&D 지원사업',
    '공고 내용...',
  ],
  chatbot: [
    '사용자 메시지',
    {
      companyProfile: '기업 정보...',
      recentMatches: '최근 매칭...',
      currentAnnouncement: '현재 공고...',
    },
  ],
}

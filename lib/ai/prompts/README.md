# AI 프롬프트 버전 관리 시스템

프롬프트를 버전별로 관리하고 A/B 테스트를 통해 성능을 추적하는 시스템입니다.

## 디렉토리 구조

```
lib/ai/prompts/
├── versions.ts       # 타입 정의
├── selector.ts       # 프롬프트 선택 로직
├── migration.ts      # 기존 프롬프트 마이그레이션
├── index.ts          # 진입점
└── README.md         # 이 파일
```

## 데이터베이스 테이블

### prompt_versions
프롬프트 버전 정보를 저장하는 테이블입니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 버전 ID |
| prompt_type | TEXT | 프롬프트 타입 (matching_analysis, eligibility_parsing 등) |
| version | TEXT | 버전 번호 (v1, v2, v3 등) |
| content | TEXT | 프롬프트 내용 (문자열 또는 함수) |
| is_active | BOOLEAN | 활성화 여부 |
| weight | INTEGER | A/B 테스트 가중치 (0-100) |
| description | TEXT | 버전 설명 |
| created_by | UUID | 생성자 |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |

### prompt_usage_logs
프롬프트 사용 로그 및 성능 메트릭을 기록하는 테이블입니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 로그 ID |
| prompt_version_id | UUID | 프롬프트 버전 ID |
| user_id | UUID | 사용자 ID |
| result_score | FLOAT | 결과 점수 (0-100) |
| response_time | INTEGER | 응답 시간 (밀리초) |
| error_message | TEXT | 에러 메시지 |
| created_at | TIMESTAMPTZ | 생성일 |

## 사용법

### 1. 기본 사용 (활성 버전)

```typescript
import { usePromptWithLogging } from '@/lib/ai/prompts'

// 매칭 분석 프롬프트 가져오기
const { content, versionId } = await usePromptWithLogging(
  'matching_analysis',
  ['공고 내용', '기업 프로필', '사업계획서'],
  userId
)

// AI에 프롬프트 전달
const result = await gemini.generate(content)

// 결과 점수 기록
await recordPromptScore(versionId, 85, userId)
```

### 2. A/B 테스트 활성화

```typescript
import { usePromptWithLogging } from '@/lib/ai/prompts'

// A/B 테스트용 무작위 버전 선택
const { content, versionId } = await usePromptWithLogging(
  'matching_analysis',
  ['공고 내용', '기업 프로필', '사업계획서'],
  userId,
  true  // A/B 테스트 활성화
)
```

### 3. 성능 메트릭 조회

```typescript
import { getPromptMetrics } from '@/lib/ai/prompts'

// 매칭 분석 프롬프트의 모든 버전 메트릭 조회
const metrics = await getPromptMetrics('matching_analysis')

for (const metric of metrics) {
  console.log(`버전: ${metric.versionId}`)
  console.log(`사용 횟수: ${metric.totalUsage}`)
  console.log(`평균 점수: ${metric.averageScore}`)
  console.log(`평균 응답 시간: ${metric.averageResponseTime}ms`)
  console.log(`성공률: ${metric.successRate}%`)
}
```

### 4. 관리자 API

#### 프롬프트 목록 조회
```bash
GET /api/admin/prompts?type=matching_analysis&activeOnly=true
```

#### 새 버전 생성
```bash
POST /api/admin/prompts
Content-Type: application/json

{
  "promptType": "matching_analysis",
  "version": "v2",
  "content": "당신은 정부지원사업 매칭 전문가입니다...",
  "description": "개선된 매칭 프롬프트 (정량적 데이터 중심)",
  "isActive": false,
  "weight": 30
}
```

#### 버전 활성화/비활성화
```bash
PUT /api/admin/prompts
Content-Type: application/json

{
  "id": "uuid",
  "isActive": true,
  "weight": 70
}
```

## 프롬프트 타입

| 타입 | 설명 | 사용처 |
|------|------|--------|
| `matching_analysis` | AI 매칭 분석 | `/api/matching` |
| `eligibility_parsing` | 지원자격 파싱 | `/api/announcements/parse-eligibility` |
| `application_section` | 지원서 섹션 작성 | `/api/applications/stream` |
| `section_improvement` | 섹션 개선 | `/api/applications/[id]/improve` |
| `evaluation_extraction` | 평가기준 추출 | `/api/announcements/parse-evaluation` |
| `chatbot` | AI 챗봇 | `/api/chat` |
| `application_score` | 지원서 점수 분석 | `/api/applications/score` |
| `section_guide` | 섹션별 작성 가이드 | `/api/applications/guide` |

## A/B 테스트 가중치 설정

가중치는 0-100 사이의 정수로, 높을수록 선택 확률이 높습니다.

**예시:**
- v1: weight 70 → 70% 확률
- v2: weight 30 → 30% 확률

## 마이그레이션

기존 프롬프트를 버전 시스템으로 마이그레이션하려면:

```bash
# Supabase 마이그레이션 실행
supabase db push

# 또는 Supabase Dashboard에서 직접 실행
# supabase/migrations/028_prompt_versions.sql
```

마이그레이션 후 `prompt_versions` 테이블에 기존 프롬프트가 v1으로 등록됩니다.

## 주의사항

- 프롬프트 내용이 함수인 경우, 문자열로 직렬화하여 저장됩니다.
- 프롬프트 타입과 버전 조합은 유니크해야 합니다.
- A/B 테스트는 활성화된 버전만 대상으로 합니다.
- 가중치 합계가 100일 필요는 없습니다 (상대적 비율로 계산).

## 향후 개선 사항

- [ ] 프롬프트 버전 비교 UI (관리자 페이지)
- [ ] 자동 A/B 테스트 리포트 (주간/월간)
- [ ] 프롬프트 버전별 성공률 알림
- [ ] 프롬프트 롤백 기능
- [ ] 프롬프트 변경 히스토리 추적

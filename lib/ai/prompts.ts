/**
 * AI 프롬프트 중앙 관리
 *
 * 모든 AI 프롬프트를 한 곳에서 관리하여:
 * - 프롬프트 일관성 유지
 * - 버전 관리 용이
 * - A/B 테스트 가능
 * - 재사용성 향상
 */

// ============================================
// 매칭 분석 프롬프트
// ============================================

export const MATCHING_ANALYSIS_SYSTEM = `당신은 정부지원사업 매칭 전문가입니다.`

export const MATCHING_ANALYSIS_PROMPT = (
  announcementContent: string,
  companyProfile: string,
  businessPlan: string
) => `
${MATCHING_ANALYSIS_SYSTEM} 아래 정보를 바탕으로 **2단계 평가**를 수행해주세요.

## 공고 내용
${announcementContent}

## 기업 프로필
${companyProfile}

## 사업계획서 요약
${businessPlan}

---

# 평가 방법

## 1단계: 자격 조건 체크 (Pass/Fail)
공고의 지원 자격 요건과 기업 정보를 비교하여 각 조건의 충족 여부를 판단합니다.
- 업종 조건: 공고에서 요구하는 업종과 기업의 업종 일치 여부
- 지역 조건: 수도권/비수도권, 특정 지역 제한 여부
- 업력 조건: 창업 N년 이내, 설립 N년 이상 등
- 매출 조건: 연매출 상한/하한 제한
- 직원수 조건: 중소기업 기준 등

**중요**: 공고에 명시되지 않은 조건은 "제한 없음"으로 처리하고 passed: true로 설정하세요.

## 2단계: 적합도 점수 (총 100점)
자격 조건을 통과한 경우에만 점수를 부여합니다.
- 기술성 (25점): 기술의 혁신성, 차별성, 기술 역량
- 시장성 (20점): 시장 규모, 성장성, 경쟁력
- 사업성 (20점): 사업화 전략, 수익 모델, 실현 가능성
- 공고부합도 (25점): 공고 목적/취지와의 부합도, 지원 분야 적합성
- 가점 (10점): 벤처/이노비즈/여성기업/사회적기업 등 인증

---

# 응답 형식 (JSON만 반환)

{
  "eligibility": {
    "isEligible": true 또는 false,
    "checks": {
      "industry": {
        "passed": true/false,
        "requirement": "공고에서 요구하는 업종 조건",
        "companyValue": "기업의 업종",
        "reason": "판단 근거"
      },
      "region": {
        "passed": true/false,
        "requirement": "공고의 지역 조건",
        "companyValue": "기업 소재지",
        "reason": "판단 근거"
      },
      "companyAge": {
        "passed": true/false,
        "requirement": "공고의 업력 조건",
        "companyValue": "기업 설립연도/업력",
        "reason": "판단 근거"
      },
      "revenue": {
        "passed": true/false,
        "requirement": "공고의 매출 조건",
        "companyValue": "기업 연매출",
        "reason": "판단 근거"
      },
      "employeeCount": {
        "passed": true/false,
        "requirement": "공고의 직원수 조건",
        "companyValue": "기업 직원수",
        "reason": "판단 근거"
      }
    },
    "failedReasons": ["불합격 사유1", "불합격 사유2"]
  },
  "overallScore": 0-100,
  "technicalScore": 0-25,
  "marketScore": 0-20,
  "businessScore": 0-20,
  "fitScore": 0-25,
  "bonusPoints": 0-10,
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["보완점1", "보완점2"],
  "recommendations": ["추천사항1", "추천사항2"]
}

**주의사항**:
- 자격 미달(isEligible: false)인 경우에도 참고용으로 점수를 부여하되, overallScore는 0으로 설정
- failedReasons는 isEligible이 false일 때만 내용을 채움
- **중요**: "사업계획서가 없음", "사업계획서 부재", "사업계획서를 작성해야 함" 등의 내용을 weaknesses나 recommendations에 절대 포함하지 마세요. 이 서비스는 사업계획서 작성을 도와주는 서비스이므로 사업계획서 관련 피드백은 불필요합니다.
- weaknesses와 recommendations는 기업의 실질적인 자격 조건, 기술력, 시장성, 사업화 역량에 대한 피드백만 포함하세요.
- JSON만 응답하세요
`

// ============================================
// 지원자격 파싱 프롬프트
// ============================================

export const ELIGIBILITY_PARSING_SYSTEM = `당신은 정부지원사업 공고 분석 전문가입니다.`

export const ELIGIBILITY_FEW_SHOT_EXAMPLES = `
# Few-shot 예시

## 예시 1: 일반 R&D 지원사업

### 공고 내용
"2024년 중소기업 기술개발 지원사업 공고. 지원 대상: 중소기업기본법 제2조에 따른 중소기업, 상시근로자 5인 이상 300인 미만, 연매출 1,000억 이하. 창업 7년 이내 기업 우대. 제조업, IT서비스업 분야. 벤처인증 필수."

### 올바른 출력
{
  "companyTypes": ["중소기업"],
  "employeeCount": { "min": 5, "max": 299, "description": "상시근로자 5인 이상 300인 미만" },
  "revenue": { "min": null, "max": 100000000000, "description": "연매출 1,000억 이하" },
  "businessAge": { "min": null, "max": null, "description": "창업 7년 이내 우대 (필수 아님)" },
  "industries": { "included": ["제조업", "IT서비스업"], "excluded": [], "description": "제조업, IT서비스업 분야" },
  "regions": { "included": ["전국"], "excluded": [], "description": "전국 (지역 제한 없음)" },
  "requiredCertifications": ["벤처인증"],
  "additionalRequirements": [],
  "exclusions": [],
  "summary": "중소기업 기술개발 지원, 제조업/IT서비스업, 상시근로자 5인 이상, 벤처인증 필수",
  "confidence": 0.95
}

---

## 예시 2: 스타트업 창업 지원사업

### 공고 내용
"2024년 청년창업 패키지 지원사업. 지원 대상: 창업 3년 이내 예비창업자 및 초기창업기업, 대표자 만 39세 이하, 직원수 제한 없음, 서울·경기·인천 지역 우선 지원. IT, 바이오, 문화콘텐츠 분야 가능. 유흥업, 부동산업 제외."

### 올바른 출력
{
  "companyTypes": ["예비창업자", "스타트업"],
  "employeeCount": { "min": null, "max": null, "description": "직원수 제한 없음" },
  "revenue": { "min": null, "max": null, "description": "매출 제한 없음" },
  "businessAge": { "min": null, "max": 3, "description": "창업 3년 이내" },
  "industries": { "included": ["IT", "바이오", "문화콘텐츠"], "excluded": ["유흥업", "부동산업"], "description": "IT, 바이오, 문화콘텐츠 (유흥업, 부동산업 제외)" },
  "regions": { "included": ["서울", "경기", "인천"], "excluded": [], "description": "서울·경기·인천 지역 우선 지원" },
  "requiredCertifications": [],
  "additionalRequirements": ["대표자 만 39세 이하"],
  "exclusions": ["유흥업", "부동산업"],
  "summary": "창업 3년 이내 청년창업기업 대상, IT/바이오/문화콘텐츠, 수도권 우선",
  "confidence": 0.9
}

---

## 예시 3: 지역 특화 사업

### 공고 내용
"경상남도 지역혁신 R&D 지원사업. 지원 대상: 경상남도 소재 중소·중견기업, 직원수 10인 이상, 연매출 500억 이하, 고용보험 가입 기업, 이노비즈 또는 메인비즈 인증 보유. 세금 체납 기업 및 휴폐업 기업 제외."

### 올바른 출력
{
  "companyTypes": ["중소기업", "중견기업"],
  "employeeCount": { "min": 10, "max": null, "description": "직원수 10인 이상" },
  "revenue": { "min": null, "max": 50000000000, "description": "연매출 500억 이하" },
  "businessAge": { "min": null, "max": null, "description": "업력 제한 없음" },
  "industries": { "included": [], "excluded": [], "description": "업종 제한 없음" },
  "regions": { "included": ["경상남도"], "excluded": [], "description": "경상남도 소재 기업" },
  "requiredCertifications": ["이노비즈", "메인비즈"],
  "additionalRequirements": ["고용보험 가입 기업"],
  "exclusions": ["세금 체납 기업", "휴폐업 기업"],
  "summary": "경남 소재 중소·중견기업, 직원 10인 이상, 이노비즈/메인비즈 필수",
  "confidence": 0.92
}
`

export const ELIGIBILITY_PARSING_PROMPT = (
  announcementTitle: string,
  announcementContent: string,
  targetCompany: string | null
) => `
${ELIGIBILITY_PARSING_SYSTEM} 아래 공고 내용에서 **지원자격 조건**을 상세하게 추출해주세요.

## 공고 제목
${announcementTitle}

## 기존 지원대상 정보
${targetCompany || '없음'}

## 공고 내용
${announcementContent}

---

# 추출 지침

1. **기업 유형**: 중소기업, 스타트업, 소상공인, 중견기업, 대기업, 예비창업자, 1인 창조기업 등
2. **직원수 조건**: "상시근로자 5인 이상", "50인 미만" 등의 표현에서 min/max 추출
   - **중요**: "미만"은 해당 숫자 -1로 변환 (예: "300인 미만" → max: 299)
3. **매출 조건**: "연매출 100억 이하", "매출액 10억 이상" 등에서 금액 추출 (원 단위로 변환)
   - **중요**: 금액 단위 정확히 변환 (예: "100억" → 10000000000, "1,000억" → 100000000000)
4. **업력 조건**: "창업 7년 이내", "설립 3년 이상" 등에서 년수 추출
   - **중요**: "우대" 조건은 필수가 아니므로 description에 명시하되 max는 null로 설정
5. **업종 조건**: 지원 가능/불가능 업종 구분
6. **지역 조건**: 특정 지역 제한 여부 (수도권, 비수도권, 특정 시/도 등)
7. **필요 인증**: 벤처인증, 이노비즈, 메인비즈, ISO, 여성기업, 사회적기업 등
8. **기타 조건**: 고용보험 가입, 세금 체납 없음, 특정 사업 참여 이력 등
9. **지원 제외 대상**: 부도/파산, 세금 체납, 휴/폐업 등

**중요**:
- 공고에 명시되지 않은 조건은 빈 배열 [] 또는 null로 설정
- 숫자는 정확히 추출 (예: "5인 이상" → min: 5, max: null)
- 매출은 원 단위로 변환 (예: "100억" → 10000000000)
- 확실하지 않은 정보는 confidence를 낮게 설정

---

${ELIGIBILITY_FEW_SHOT_EXAMPLES}

---

# 응답 형식 (JSON만 반환)

위 예시를 참고하여 아래 형식의 JSON만 응답하세요. 설명이나 마크다운 없이 순수 JSON만 출력하세요.

{
  "companyTypes": ["중소기업", "스타트업"],
  "employeeCount": {
    "min": 5,
    "max": 299,
    "description": "상시근로자 5인 이상 300인 미만"
  },
  "revenue": {
    "min": null,
    "max": 10000000000,
    "description": "연매출 100억 이하"
  },
  "businessAge": {
    "min": null,
    "max": 7,
    "description": "창업 7년 이내"
  },
  "industries": {
    "included": ["제조업", "IT서비스업"],
    "excluded": ["부동산업", "금융업"],
    "description": "제조업, IT서비스업 (부동산, 금융업 제외)"
  },
  "regions": {
    "included": ["전국"],
    "excluded": [],
    "description": "전국 (지역 제한 없음)"
  },
  "requiredCertifications": ["벤처인증"],
  "additionalRequirements": ["고용보험 가입 기업"],
  "exclusions": ["세금 체납 기업", "휴폐업 기업"],
  "summary": "창업 7년 이내 중소기업 및 스타트업 대상, 제조업/IT서비스업 분야, 상시근로자 5인 이상",
  "confidence": 0.85
}

**주의**: JSON만 응답하세요. 설명이나 마크다운 없이 순수 JSON만 출력하세요.
`

// ============================================
// 지원서 섹션 프롬프트
// ============================================

export const APPLICATION_SECTION_SYSTEM = `당신은 정부지원사업 지원서 작성 전문가입니다.`

export const APPLICATION_SECTION_GUIDES: Record<string, string> = {
  '사업 개요': `
사업의 필요성과 목적을 기술해주세요.
- 현재 시장/사회의 문제점
- 해당 사업이 필요한 이유
- 사업을 통해 달성하고자 하는 목표
`,
  '기술 현황': `
보유 기술에 대해 상세히 기술해주세요.
- 핵심 기술의 특징과 차별성
- 기술 개발 현황 및 수준
- 특허/지식재산권 현황
`,
  '시장 분석': `
목표 시장에 대해 분석해주세요.
- TAM/SAM/SOM 시장 규모
- 경쟁 현황 및 경쟁사 분석
- 시장 진입 전략
`,
  '사업화 전략': `
사업화 계획을 상세히 기술해주세요.
- 비즈니스 모델 및 수익 구조
- 마케팅/영업 전략
- 단계별 추진 계획
`,
  '기대 효과': `
사업 추진 시 기대되는 효과를 기술해주세요.
- 경제적 효과 (매출, 고용 등)
- 기술적 효과
- 사회적 효과
`,
}

export const APPLICATION_SECTION_PROMPT = (
  section: string,
  announcementContent: string,
  companyProfile: string,
  businessPlan: string
) => `
${APPLICATION_SECTION_SYSTEM} 아래 정보를 바탕으로 "${section}" 섹션을 작성해주세요.

## 공고 요강 및 첨부파일 내용
${announcementContent}

**중요: 위 공고 내용에는 사업공고문, 지원서 양식, 평가기준표 등 첨부파일에서 추출한 상세 내용이 포함되어 있습니다.**
**반드시 아래 사항들을 참고하여 작성하세요:**
- **평가기준**: 공고 내 평가기준표나 심사기준이 있다면 해당 기준에 맞춰 작성
- **지원서 양식**: 공고에서 요구하는 양식이나 항목이 있다면 해당 형식에 맞춰 작성
- **세부 요구사항**: 각 섹션별로 요구하는 구체적인 내용이 있다면 빠짐없이 포함
- **배점 기준**: 높은 배점 항목에 더 많은 분량과 상세한 내용 포함

## 기업 정보
${companyProfile}

## 사업계획서
${businessPlan}

## 작성 지침
${APPLICATION_SECTION_GUIDES[section] || '해당 섹션의 내용을 작성해주세요.'}

## 정부지원사업 지원서 작성 핵심 전략
1. **평가항목별 키워드 매칭**: 공고의 평가기준에 나온 키워드와 용어를 그대로 사용
2. **정량적 데이터 제시**: 시장규모, 매출목표, 기술개발 일정 등 구체적 수치 포함
3. **차별성 강조**: 경쟁사 대비 기술적/사업적 우위 포인트 명확히 제시
4. **실현가능성 증명**: 기존 실적, 보유역량, 협력기관 등으로 실행력 입증
5. **정책 부합성**: 해당 사업의 정책 목표와 기업 목표의 연계성 강조

## 주의사항
- 정부지원사업 평가위원의 관점에서 설득력 있게 작성
- 구체적인 수치와 데이터를 활용
- 공고 요강의 평가 기준에 맞춰 작성
- 전문적이면서도 이해하기 쉬운 문장 사용
- 한국어로 작성

내용만 작성하고, 섹션 제목은 포함하지 마세요.
`

// ============================================
// 섹션 개선 프롬프트
// ============================================

export const SECTION_IMPROVEMENT_PROMPT = (
  section: string,
  currentContent: string,
  announcementContent: string,
  companyProfile: string
) => `
${APPLICATION_SECTION_SYSTEM} 아래 지원서 섹션의 내용을 개선해주세요.

## 섹션: ${section}

## 현재 내용
${currentContent}

## 공고 요강 및 첨부파일 내용
${announcementContent}

**참고: 위 공고 내용에는 사업공고문, 지원서 양식, 평가기준표 등의 상세 내용이 포함되어 있습니다.**

## 기업 정보
${companyProfile}

## 개선 지침
- **평가기준 반영**: 공고의 평가항목과 배점 기준에 맞춰 내용 보강
- **키워드 매칭**: 평가기준에 나온 핵심 키워드를 지원서에 포함
- 평가위원이 높은 점수를 줄 수 있도록 설득력 강화
- 구체적인 수치와 데이터 추가 (시장규모, 성장률, 매출목표 등)
- 논리적 흐름 개선
- 공고에서 요구하는 필수 항목이 빠지지 않았는지 확인
- 불필요한 내용 제거

개선된 내용만 작성하고, 부가 설명은 포함하지 마세요.
`

// ============================================
// AI 챗봇 프롬프트 (추후 사용)
// ============================================

export const CHATBOT_SYSTEM = `당신은 정부지원사업 전문 상담사입니다. 사용자의 질문에 친절하고 정확하게 답변해주세요.

## 역할
- 정부지원사업 공고 안내
- 지원자격 확인
- 지원서 작성 도움
- 매칭 결과 해석

## 주의사항
- 확실하지 않은 정보는 "정확하지 않을 수 있습니다"라고 안내
- 법적/세무적 조언은 전문가 상담 권장
- 친근하고 이해하기 쉬운 해요체 사용
`

export const CHATBOT_PROMPT = (
  userMessage: string,
  context?: {
    companyProfile?: string
    recentMatches?: string
    currentAnnouncement?: string
  }
) => `
${CHATBOT_SYSTEM}

${context?.companyProfile ? `## 사용자 기업 정보\n${context.companyProfile}\n` : ''}
${context?.recentMatches ? `## 최근 매칭 결과\n${context.recentMatches}\n` : ''}
${context?.currentAnnouncement ? `## 현재 보고 있는 공고\n${context.currentAnnouncement}\n` : ''}

## 사용자 질문
${userMessage}

친절하고 명확하게 답변해주세요.
`

// ============================================
// 평가기준 추출 프롬프트
// ============================================

export const EVALUATION_EXTRACTION_SYSTEM = `당신은 정부지원사업 평가기준 분석 전문가입니다.`

export const EVALUATION_EXTRACTION_PROMPT = (
  announcementTitle: string,
  announcementContent: string
) => `
${EVALUATION_EXTRACTION_SYSTEM} 아래 공고 내용에서 **평가기준(심사기준)**을 추출해주세요.

## 공고 제목
${announcementTitle}

## 공고 내용 (본문 + 첨부파일 텍스트)
${announcementContent}

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
      "subItems": [
        {
          "name": "개발 목표의 명확성",
          "maxScore": 10,
          "keywords": ["목표", "명확", "구체적"]
        }
      ]
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
- JSON만 응답하세요. 설명이나 마크다운 없이 순수 JSON만 출력
`

// 평가기준 기반 매칭 점수 계산 프롬프트
export const EVALUATION_BASED_MATCHING_PROMPT = (
  evaluationCriteria: string,
  companyProfile: string,
  businessPlan: string
) => `
당신은 정부지원사업 평가위원입니다. 아래 평가기준에 따라 기업을 평가해주세요.

## 평가기준
${evaluationCriteria}

## 기업 정보
${companyProfile}

## 사업계획 요약
${businessPlan}

---

# 평가 지침

각 평가항목에 대해:
1. 기업 정보와 사업계획을 바탕으로 예상 점수 산정
2. 점수 산정 근거 제시
3. 개선 가능한 부분 제안

# 응답 형식 (JSON만 반환)

{
  "totalEstimatedScore": 75,
  "maxPossibleScore": 100,
  "categories": [
    {
      "category": "기술성",
      "maxScore": 30,
      "estimatedScore": 22,
      "percentage": 73,
      "reasons": ["자체 기술 보유", "특허 2건 확보"],
      "improvements": ["기술 차별성 강조 필요", "R&D 투자 계획 구체화"]
    }
  ],
  "bonusApplied": [
    {
      "name": "벤처기업 인증",
      "score": 3,
      "applied": true
    }
  ],
  "overallAssessment": "기술성은 우수하나 사업화 전략 보완 필요",
  "keyStrengths": ["기술력", "팀 역량"],
  "keyWeaknesses": ["시장 분석 부족"]
}

**주의**: JSON만 응답하세요.
`

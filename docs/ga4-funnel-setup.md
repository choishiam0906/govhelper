# GA4 비회원 매칭 플로우 퍼널 설정 가이드

이 문서는 GovHelper 비회원 매칭 플로우(/try)의 Step별 포기율을 Google Analytics 4(GA4)로 추적하기 위한 설정 가이드입니다.

---

## 1. 개요

### 추적 대상
비회원 매칭 플로우의 각 단계에서 이탈하는 사용자를 추적하여 병목 지점을 파악합니다.

### 퍼널 구조
```
Step 1: 사업자번호 입력 → Step 2: 기업정보 입력 → Step 3: 이메일 입력 → 결과 페이지 → 회원가입
```

---

## 2. GA4 이벤트 목록

### 2.1 Step별 진행 이벤트

| 이벤트명 | 설명 | 매개변수 |
|---------|------|----------|
| `try_step_1_start` | 1단계 시작 (사업자번호 입력) | `step`, `step_name` |
| `try_step_1_complete` | 1단계 완료 | `step`, `has_business_number`, `business_lookup_success` |
| `try_step_2_start` | 2단계 시작 (기업정보 입력) | `step`, `step_name` |
| `try_step_2_complete` | 2단계 완료 | `step`, `industry`, `employee_count`, `location` 등 |
| `try_step_3_start` | 3단계 시작 (이메일 입력) | `step`, `step_name` |
| `try_step_3_complete` | 3단계 완료 (분석 요청) | `step`, `email_domain` |
| `try_result_view` | 결과 페이지 조회 | `result_id`, `match_count`, `top_score` 등 |
| `try_signup_click` | 회원가입 버튼 클릭 | `source` (클릭 위치) |

### 2.2 포기 이벤트

| 이벤트명 | 설명 | 매개변수 |
|---------|------|----------|
| `try_step_abandon` | 단계 포기 (페이지 이탈) | `abandoned_step`, `abandoned_step_name`, `time_on_step` |

---

## 3. GA4 대시보드 설정

### 3.1 퍼널 탐색 보고서 생성

1. **GA4 > 탐색(Explore) > 빈 템플릿** 클릭
2. **시각화 유형**을 **퍼널 탐색**으로 변경
3. **단계 설정**:

#### Step 1: 사업자번호 입력 시작
- **이벤트 이름**: `try_step_1_start`
- **조건**: 없음

#### Step 2: 사업자번호 입력 완료
- **이벤트 이름**: `try_step_1_complete`
- **조건**: 없음

#### Step 3: 기업정보 입력 시작
- **이벤트 이름**: `try_step_2_start`
- **조건**: 없음

#### Step 4: 기업정보 입력 완료
- **이벤트 이름**: `try_step_2_complete`
- **조건**: 없음

#### Step 5: 이메일 입력 시작
- **이벤트 이름**: `try_step_3_start`
- **조건**: 없음

#### Step 6: 이메일 입력 완료 (분석 요청)
- **이벤트 이름**: `try_step_3_complete`
- **조건**: 없음

#### Step 7: 결과 페이지 조회
- **이벤트 이름**: `try_result_view`
- **조건**: 없음

#### Step 8: 회원가입 버튼 클릭
- **이벤트 이름**: `try_signup_click`
- **조건**: 없음

4. **세부 항목(Breakdown)** 설정:
   - `event_parameter: industry` (업종별 분석)
   - `event_parameter: location` (지역별 분석)
   - `device_category` (기기별 분석)

5. **이름 저장**: "비회원 매칭 플로우 퍼널"

---

### 3.2 포기율 분석 보고서 생성

1. **GA4 > 탐색(Explore) > 빈 템플릿** 클릭
2. **시각화 유형**을 **자유 형식**으로 설정
3. **측정기준 추가**:
   - `이벤트 이름`
   - `이벤트 매개변수: abandoned_step`
   - `이벤트 매개변수: abandoned_step_name`

4. **측정항목 추가**:
   - `이벤트 수`
   - `이벤트별 사용자 수`

5. **필터 추가**:
   - **이벤트 이름** = `try_step_abandon`

6. **이름 저장**: "비회원 매칭 플로우 포기 분석"

---

### 3.3 회원가입 전환율 보고서

1. **GA4 > 탐색(Explore) > 빈 템플릿** 클릭
2. **시각화 유형**을 **자유 형식**으로 설정
3. **측정기준 추가**:
   - `이벤트 매개변수: source` (회원가입 버튼 클릭 위치)

4. **측정항목 추가**:
   - `이벤트 수` (try_signup_click)
   - `전환 수` (회원가입 완료 이벤트)

5. **필터 추가**:
   - **이벤트 이름** = `try_signup_click`

6. **이름 저장**: "비회원 매칭 → 회원가입 전환 분석"

---

## 4. 핵심 지표 (KPI)

### 4.1 단계별 전환율
```
Step 1 완료율 = (try_step_1_complete 수) / (try_step_1_start 수) × 100%
Step 2 완료율 = (try_step_2_complete 수) / (try_step_2_start 수) × 100%
Step 3 완료율 = (try_step_3_complete 수) / (try_step_3_start 수) × 100%
```

### 4.2 전체 퍼널 전환율
```
전체 전환율 = (try_signup_click 수) / (try_step_1_start 수) × 100%
```

### 4.3 포기율
```
Step 1 포기율 = (try_step_abandon [step=1] 수) / (try_step_1_start 수) × 100%
Step 2 포기율 = (try_step_abandon [step=2] 수) / (try_step_2_start 수) × 100%
Step 3 포기율 = (try_step_abandon [step=3] 수) / (try_step_3_start 수) × 100%
```

---

## 5. 분석 인사이트 예시

### 5.1 병목 지점 파악
- **Step 2 → Step 3 전환율이 낮은 경우**: 기업정보 입력 단계가 너무 복잡함 → 필수 항목 축소 검토
- **Step 3 → 결과 페이지 전환율이 낮은 경우**: 이메일 입력 단계에서 신뢰도 문제 → 안심 메시지 강화

### 5.2 세그먼트별 분석
- **업종별 전환율 차이**: 특정 업종의 전환율이 낮다면 해당 업종 맞춤 메시지 필요
- **기기별 전환율 차이**: 모바일 전환율이 낮다면 모바일 UX 개선 필요

### 5.3 최적화 우선순위
1. 가장 큰 전환율 하락이 발생하는 단계 개선
2. 포기율이 높은 단계의 사용자 행동 분석 (Session Recording 등)
3. A/B 테스트로 개선안 검증

---

## 6. 맞춤 측정기준 생성 (선택 사항)

더 세밀한 분석을 위해 GA4에서 맞춤 측정기준을 생성할 수 있습니다.

### 6.1 생성 방법
1. **GA4 > 관리 > 데이터 표시 > 맞춤 정의** 클릭
2. **맞춤 측정기준 만들기** 클릭

### 6.2 추천 맞춤 측정기준

| 측정기준 이름 | 매개변수 이름 | 범위 |
|--------------|---------------|------|
| 업종 | `industry` | 이벤트 |
| 지역 | `location` | 이벤트 |
| 직원수 | `employee_count` | 이벤트 |
| 이메일 도메인 | `email_domain` | 이벤트 |
| 사업자번호 입력 여부 | `has_business_number` | 이벤트 |
| 포기 단계 | `abandoned_step` | 이벤트 |

---

## 7. 알림 설정

전환율이 급격히 하락하는 경우 알림을 받도록 설정할 수 있습니다.

### 7.1 맞춤 알림 생성
1. **GA4 > 관리 > 맞춤 알림** 클릭
2. **맞춤 알림 만들기** 클릭
3. **조건 설정**:
   - **측정항목**: `이벤트 수`
   - **이벤트 이름**: `try_step_1_complete`
   - **조건**: `7일간 평균 대비 20% 감소`
4. **알림 수신자** 이메일 추가
5. **저장**

---

## 8. 참고 사항

### 8.1 이벤트 매개변수 상세 설명

#### `try_step_1_complete` 매개변수
- `has_business_number` (boolean): 사업자번호를 입력했는지 여부
- `business_lookup_success` (boolean): 사업자번호 조회 성공 여부
- `skipped` (boolean): 사업자번호 입력을 건너뛰었는지 여부

#### `try_step_2_complete` 매개변수
- `industry` (string): 선택한 업종
- `employee_count` (number): 입력한 직원수
- `location` (string): 선택한 지역
- `has_annual_revenue` (boolean): 연매출을 입력했는지 여부
- `has_founded_date` (boolean): 설립일을 입력했는지 여부
- `certifications_count` (number): 선택한 인증 개수

#### `try_result_view` 매개변수
- `result_id` (string): 매칭 결과 ID
- `match_count` (number): 매칭된 공고 수
- `top_score` (number): 최고 매칭 점수
- `blurred_count` (number): 블러 처리된 공고 수 (1~2순위)
- `visible_count` (number): 공개된 공고 수 (3~5순위)

#### `try_signup_click` 매개변수
- `source` (string): 클릭 위치
  - `header`: 헤더 회원가입 버튼
  - `blurred_card`: 블러 카드 내 버튼
  - `cta_card`: 하단 CTA 카드 버튼

### 8.2 디버깅 방법

#### Chrome DevTools
1. **F12** 키로 개발자 도구 열기
2. **Console** 탭에서 다음 명령어 입력:
```javascript
window.dataLayer
```
3. GA4 이벤트가 `dataLayer`에 푸시되는지 확인

#### GA4 DebugView
1. **Chrome 확장 프로그램**: Google Analytics Debugger 설치
2. 확장 프로그램 활성화
3. **GA4 > 구성 > DebugView** 에서 실시간 이벤트 확인

---

## 9. 체크리스트

프로덕션 배포 전 다음 사항을 확인하세요:

- [ ] GA4 측정 ID가 `.env.local`에 설정되어 있음 (`NEXT_PUBLIC_GA_MEASUREMENT_ID`)
- [ ] 모든 Step별 이벤트가 정상 발생하는지 DebugView로 확인
- [ ] 퍼널 탐색 보고서에서 데이터가 수집되는지 확인 (24시간 소요)
- [ ] 맞춤 측정기준이 제대로 설정되어 있는지 확인
- [ ] 알림이 정상 작동하는지 확인

---

## 10. 관련 파일

| 파일 | 설명 |
|------|------|
| `lib/analytics/events.ts` | GA4 이벤트 상수 정의 |
| `app/try/page.tsx` | 비회원 매칭 플로우 페이지 (Step 1~3) |
| `app/try/result/[id]/page.tsx` | 매칭 결과 페이지 |
| `components/analytics/google-analytics.tsx` | GA4 스크립트 컴포넌트 |

---

## 11. 문의

GA4 설정 관련 문의는 다음으로 연락해주세요:
- 담당자: GovHelper 개발팀
- 이메일: support@govhelpers.com

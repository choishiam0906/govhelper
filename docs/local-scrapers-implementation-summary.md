# 지자체 스크래퍼 구현 완료 요약

## 완료 일시
2026-01-28

## 구현 개요
서울시와 경기도 지원사업 공고 수집을 위한 스크래퍼 인프라를 구축했습니다.

---

## 생성된 파일

### 1. 스크래퍼 코어 파일
| 파일 | 설명 |
|------|------|
| `lib/announcements/scrapers/types.ts` | 스크래퍼 타입 정의 (ScraperAnnouncement, ScraperResult) |
| `lib/announcements/scrapers/index.ts` | 스크래퍼 레지스트리 및 헬퍼 함수 |
| `lib/announcements/scrapers/seoul.ts` | 서울시 스크래퍼 클래스 |
| `lib/announcements/scrapers/gyeonggi.ts` | 경기도 스크래퍼 클래스 |
| `lib/announcements/scrapers/README.md` | 스크래퍼 추가 가이드 |

### 2. 문서
| 파일 | 설명 |
|------|------|
| `docs/local-sources-implementation.md` | 업데이트 (완료 현황 반영) |
| `docs/local-scrapers-implementation-summary.md` | 이 파일 |

---

## 수정된 파일

### 1. 동기화 API
**파일:** `app/api/announcements/local/sync/route.ts`

**변경 사항:**
- 스크래퍼 레지스트리 import
- 활성화된 지자체별 스크래퍼 자동 실행
- 중복 감지 통합
- AI 자동 분류 통합
- 구조화된 로깅 (createRequestLogger)

**주요 로직:**
```typescript
for (const source of enabledSources) {
  const scraper = getScraperById(source.id)
  const result = await scraper.scrape({ limit: 20, daysBack: 30 })

  // 중복 감지
  // DB 저장 (syncWithChangeDetection)
  // AI 자동 분류 (최신 10개)
}
```

### 2. 지자체 소스 활성화
**파일:** `lib/announcements/local-sources.ts`

**변경 사항:**
- 서울시: `enabled: false` → `enabled: true`
- 경기도: `enabled: false` → `enabled: true`

---

## 의존성 추가

**패키지:** `cheerio` (HTML 스크래핑용)

```bash
npm install cheerio --save
```

**설치 버전:** cheerio@latest (22 packages added)

---

## 구현 세부 사항

### 스크래퍼 아키텍처

```
LocalScraper Interface
    ↓
SeoulScraper / GyeonggiScraper 클래스
    ↓
scrape(options) 메서드
    ↓
ScraperResult { announcements, total, source }
```

### 데이터 플로우

```
1. 활성화된 지자체 소스 조회
   ↓
2. 각 지자체별 스크래퍼 실행
   ↓
3. 공고 수집 (API/RSS/HTML)
   ↓
4. 표준 포맷 변환 (ScraperAnnouncement)
   ↓
5. 중복 감지 (제목 기반)
   ↓
6. DB 저장 (announcements 테이블)
   ↓
7. AI 자동 분류 (eligibility_criteria)
```

### 표준 데이터 포맷

```typescript
interface ScraperAnnouncement {
  source_id: string              // 원본 ID (고유값)
  title: string                  // 공고 제목
  organization: string           // 지원 기관명
  category?: string              // 분류
  support_type?: string          // 지원 유형
  target_company?: string        // 대상 기업
  support_amount?: string        // 지원 금액
  application_start?: string     // 접수 시작일 (YYYY-MM-DD)
  application_end?: string       // 접수 마감일 (YYYY-MM-DD)
  content?: string               // 공고 내용
  detail_url?: string            // 상세보기 URL
  attachment_urls?: string[]     // 첨부파일 URL
}
```

### source 필드 명명 규칙

| 지자체 | source 필드 |
|--------|------------|
| 서울시 | `local_seoul` |
| 경기도 | `local_gyeonggi` |
| 부산시 | `local_busan` (향후) |

---

## 현재 상태

### ✅ 완료된 작업
1. 스크래퍼 타입 시스템 구축
2. 스크래퍼 레지스트리 시스템 구현
3. 서울시 스크래퍼 클래스 생성 (구조)
4. 경기도 스크래퍼 클래스 생성 (구조)
5. 동기화 API 통합
6. 중복 감지 통합
7. AI 자동 분류 통합
8. 구조화된 로깅 추가
9. 서울시/경기도 소스 활성화
10. cheerio 의존성 설치
11. 구현 가이드 문서 작성

### 🔧 남은 작업 (실제 데이터 소스 연동)

#### 서울시
**필요한 작업:**
1. 서울시 공공데이터 포털 (data.seoul.go.kr) 확인
2. 적절한 API 또는 RSS 피드 URL 확보
3. API 키 발급 (필요한 경우)
4. `seoul.ts`의 `scrape()` 메서드 구현 완성
5. 환경변수 추가 (`SEOUL_DATA_API_KEY`)

**가능한 데이터 소스:**
- 서울시 공공데이터 포털 API
- 서울시청 지원사업 RSS 피드
- 서울시청 웹사이트 HTML 스크래핑

#### 경기도
**필요한 작업:**
1. 경기도 공공데이터 포털 (data.gg.go.kr) 확인
2. 적절한 API 또는 RSS 피드 URL 확보
3. API 키 발급 (필요한 경우)
4. `gyeonggi.ts`의 `scrape()` 메서드 구현 완성
5. 환경변수 추가 (`GYEONGGI_DATA_API_KEY`)

**가능한 데이터 소스:**
- 경기도 공공데이터 포털 API
- 경기도청 지원사업 RSS 피드
- 경기도청 웹사이트 HTML 스크래핑

---

## 구현된 기능

### 1. 에러 처리
- 각 스크래퍼의 에러는 독립적으로 처리
- 한 지자체 실패 시 다른 지자체는 계속 진행
- 빈 결과 반환으로 graceful degradation

### 2. 중복 감지
- 제목 정규화 (연도/차수 제거)
- Levenshtein 거리 기반 유사도 계산
- 90% 이상 유사 시 중복 처리

### 3. 날짜 파싱
다양한 날짜 형식 지원:
- `2026-01-28`
- `2026.01.28`
- `20260128`
- `~ 2026.01.28` (마감일만 추출)

### 4. AI 자동 분류
동기화 후 최신 10개 공고 자동 파싱:
- 기업유형, 직원수, 매출, 업력
- 업종/지역 제한
- 필요 인증

---

## 테스트 방법

### 수동 트리거
```bash
# 로컬 개발
curl -X POST http://localhost:3000/api/announcements/local/sync

# 프로덕션
curl -X POST https://govhelpers.com/api/announcements/local/sync
```

### 로그 확인
관리자 대시보드:
- URL: `/admin`
- 소스: `local`

API:
```bash
curl https://govhelpers.com/api/admin/sync-status?source=local
```

### Cron 스케줄
`vercel.json`:
```json
{
  "path": "/api/announcements/local/sync",
  "schedule": "0 4 * * *"  // 매일 04:00 UTC (13:00 KST)
}
```

---

## 확장 방법

### 새 지자체 추가 (예: 부산시)

#### 1단계: 스크래퍼 파일 생성
`lib/announcements/scrapers/busan.ts`

#### 2단계: 레지스트리 등록
`lib/announcements/scrapers/index.ts`:
```typescript
import { busanScraper } from './busan'

export const scrapers: Record<string, LocalScraper> = {
  seoul: seoulScraper,
  gyeonggi: gyeonggiScraper,
  busan: busanScraper,  // 추가
}
```

#### 3단계: 소스 활성화
`lib/announcements/local-sources.ts`:
```typescript
{
  id: 'busan',
  name: '부산광역시',
  enabled: true,  // false → true
}
```

#### 4단계: 동기화
API가 자동으로 새 스크래퍼를 인식하고 실행합니다.

---

## 주의사항

### 1. robots.txt 준수
웹 스크래핑 시 각 사이트의 `robots.txt` 확인 필수

### 2. 요청 간격
- 최소 1초 간격 유지
- API Rate Limit 확인
- 필요 시 딜레이 추가

### 3. User-Agent 헤더
```typescript
headers: {
  'User-Agent': 'Mozilla/5.0 (compatible; GovHelper/1.0)',
}
```

### 4. 에러 핸들링
모든 스크래퍼는 에러 발생 시 빈 결과를 반환하고 계속 진행

---

## 참고 문서

| 문서 | 위치 |
|------|------|
| 스크래퍼 추가 가이드 | `lib/announcements/scrapers/README.md` |
| 지자체 소스 구현 가이드 | `docs/local-sources-implementation.md` |
| 이 요약 문서 | `docs/local-scrapers-implementation-summary.md` |

---

## 다음 단계

### 즉시 수행 가능
1. 서울시 공공데이터 포털에서 지원사업 API 확인
2. 경기도 공공데이터 포털에서 지원사업 API 확인
3. API 키 발급 신청

### 단기 (1-2주)
1. 서울시/경기도 스크래퍼 실제 데이터 연동
2. 테스트 및 검증
3. 부산시, 대구시 스크래퍼 추가

### 중장기 (1-3개월)
1. 나머지 13개 광역시/도 스크래퍼 추가
2. 시군구 단위 지원사업 확장 고려
3. 스크래핑 성능 최적화

---

## 작성자
- 작성자: Claude (Sisyphus-Junior)
- 작성일: 2026-01-28
- 버전: 1.0.0

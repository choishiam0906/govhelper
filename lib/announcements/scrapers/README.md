# 지자체 공고 스크래퍼 구현 가이드

## 개요

지자체(광역시/도) 정부지원사업 공고를 자동으로 수집하는 스크래퍼 시스템입니다.

---

## 현재 구현 상태

### ✅ 구현 완료

| 지자체 | 스크래퍼 파일 | 활성화 | 데이터 소스 상태 |
|--------|--------------|--------|-----------------|
| 서울특별시 | `seoul.ts` | ✅ | 🔧 구조만 구축 (실제 API 필요) |
| 경기도 | `gyeonggi.ts` | ✅ | 🔧 구조만 구축 (실제 API 필요) |

### 📋 구현 대기

나머지 15개 광역시/도:
- 부산, 대구, 인천, 광주, 대전, 울산, 세종
- 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주

---

## 아키텍처

```
활성화된 지자체 소스
    ↓
스크래퍼 실행 (API/RSS/HTML)
    ↓
표준 포맷 변환 (ScraperAnnouncement)
    ↓
중복 감지 (제목 기반)
    ↓
DB 저장 (announcements 테이블)
    ↓
AI 자동 분류 (eligibility_criteria)
```

---

## 파일 구조

```
lib/announcements/scrapers/
├── types.ts           # 타입 정의
├── index.ts           # 스크래퍼 레지스트리
├── seoul.ts           # 서울시 스크래퍼
├── gyeonggi.ts        # 경기도 스크래퍼
└── README.md          # 이 파일
```

---

## 스크래퍼 구현 방법

### 1단계: 새 스크래퍼 파일 생성

`lib/announcements/scrapers/busan.ts` (예시: 부산시)

```typescript
import * as cheerio from 'cheerio'
import { ScraperResult, ScraperOptions, ScraperAnnouncement } from './types'

export class BusanScraper {
  readonly id = 'busan'
  readonly name = '부산광역시'

  private readonly BASE_URL = 'https://www.busan.go.kr'

  async scrape(options?: ScraperOptions): Promise<ScraperResult> {
    const limit = options?.limit || 20

    try {
      // TODO: 실제 API 호출 또는 웹 스크래핑 로직
      const announcements = await this.fetchAnnouncements(limit)

      return {
        announcements,
        total: announcements.length,
        source: 'local_busan',
      }

    } catch (error) {
      console.error('[부산시 스크래퍼] 오류:', error)
      return {
        announcements: [],
        total: 0,
        source: 'local_busan',
      }
    }
  }

  private async fetchAnnouncements(limit: number): Promise<ScraperAnnouncement[]> {
    // 구현 방법 선택:
    // 1. 공공데이터 API
    // 2. RSS 피드
    // 3. HTML 스크래핑

    return []
  }
}

export const busanScraper = new BusanScraper()
```

### 2단계: 레지스트리에 등록

`lib/announcements/scrapers/index.ts` 수정:

```typescript
import { busanScraper } from './busan'

export const scrapers: Record<string, LocalScraper> = {
  seoul: seoulScraper,
  gyeonggi: gyeonggiScraper,
  busan: busanScraper,  // 추가
  // ...
}
```

### 3단계: 지자체 소스 활성화

`lib/announcements/local-sources.ts` 수정:

```typescript
{
  id: 'busan',
  name: '부산광역시',
  url: 'https://www.busan.go.kr',
  enabled: true,  // false → true
  description: '부산시 중소기업 및 스타트업 지원사업'
}
```

### 4단계: 동기화 API 자동 연동

동기화 API (`app/api/announcements/local/sync/route.ts`)가 자동으로 새 스크래퍼를 인식하고 실행합니다.

---

## 데이터 소스 수집 방법

### 방법 1: 공공데이터 API (권장)

**장점:**
- 안정적인 데이터 제공
- 구조화된 JSON 응답
- 변경에 강함

**예시:**
```typescript
private async fetchFromApi(limit: number): Promise<ScraperAnnouncement[]> {
  const apiKey = process.env.BUSAN_DATA_API_KEY
  const url = `https://openapi.busan.go.kr/api/support?key=${apiKey}&limit=${limit}`

  const response = await fetch(url)
  const data = await response.json()

  return data.items.map(item => ({
    source_id: item.id,
    title: item.title,
    organization: '부산광역시',
    application_end: item.deadline,
    detail_url: item.url,
  }))
}
```

**환경변수 추가:**
`.env.local`에 API 키 추가:
```bash
BUSAN_DATA_API_KEY=발급받은_API_키
```

### 방법 2: RSS 피드

**장점:**
- 간단한 구현
- 별도 API 키 불필요
- 실시간 업데이트

**예시:**
```typescript
// rss-parser 설치 필요: npm install rss-parser
import Parser from 'rss-parser'

private async fetchFromRss(limit: number): Promise<ScraperAnnouncement[]> {
  const parser = new Parser()
  const feed = await parser.parseURL('https://www.busan.go.kr/rss/support.xml')

  return feed.items.slice(0, limit).map(item => ({
    source_id: item.guid || item.link,
    title: item.title,
    organization: '부산광역시',
    content: item.contentSnippet,
    detail_url: item.link,
    application_end: this.parseDate(item.pubDate),
  }))
}
```

### 방법 3: HTML 스크래핑 (최후 수단)

**주의사항:**
- 웹사이트 구조 변경 시 스크래퍼 수정 필요
- robots.txt 확인 필수
- 요청 간격 1초 이상 유지
- User-Agent 헤더 명시

**예시:**
```typescript
private async fetchFromWeb(limit: number): Promise<ScraperAnnouncement[]> {
  const url = 'https://www.busan.go.kr/support/list'

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; GovHelper/1.0)',
    },
  })

  const html = await response.text()
  const $ = cheerio.load(html)

  const announcements: ScraperAnnouncement[] = []

  $('.notice-list .item').each((index, element) => {
    if (index >= limit) return false

    const $el = $(element)

    announcements.push({
      source_id: `BUSAN_${Date.now()}_${index}`,
      title: $el.find('.title').text().trim(),
      organization: '부산광역시',
      detail_url: this.buildUrl($el.find('a').attr('href')),
      application_end: this.parseDate($el.find('.date').text()),
    })
  })

  return announcements
}
```

---

## 표준 데이터 포맷

스크래퍼는 다음 형식으로 데이터를 반환해야 합니다:

```typescript
interface ScraperAnnouncement {
  source_id: string              // 필수: 원본 ID (고유값)
  title: string                  // 필수: 공고 제목
  organization: string           // 필수: 지원 기관명

  category?: string              // 선택: 분류 (기본: '지자체')
  support_type?: string          // 선택: 지원 유형 (기본: 지자체명)
  target_company?: string        // 선택: 대상 기업
  support_amount?: string        // 선택: 지원 금액
  application_start?: string     // 선택: 접수 시작일 (YYYY-MM-DD)
  application_end?: string       // 선택: 접수 마감일 (YYYY-MM-DD)
  content?: string               // 선택: 공고 내용
  detail_url?: string            // 선택: 상세보기 URL
  attachment_urls?: string[]     // 선택: 첨부파일 URL 목록
}
```

---

## source 필드 명명 규칙

각 지자체의 `source` 필드는 다음 형식을 따릅니다:

```
local_{지자체ID}
```

| 지자체 | source 필드 |
|--------|------------|
| 서울시 | `local_seoul` |
| 경기도 | `local_gyeonggi` |
| 부산시 | `local_busan` |
| 대구시 | `local_daegu` |
| ... | ... |

---

## 중복 감지

동기화 API가 자동으로 중복을 감지합니다:

1. **제목 정규화**: 연도/차수 제거, 특수문자 제거
2. **정확 매칭**: 정규화 후 제목이 동일하면 중복
3. **유사도 매칭**: Levenshtein 거리 90% 이상이면 중복

중복으로 판단되면 DB에 저장하지 않습니다.

---

## AI 자동 분류

동기화 후 최신 10개 공고에 대해 AI가 자동으로 지원자격을 파싱합니다:

- 기업유형 (중소기업, 스타트업 등)
- 직원수 범위
- 매출 범위
- 업력 조건
- 업종/지역 제한
- 필요 인증 (벤처, 이노비즈 등)

파싱 결과는 `announcements.eligibility_criteria` (JSONB) 컬럼에 저장됩니다.

---

## 테스트

### 수동 트리거

```bash
# 로컬 개발 환경
curl -X POST http://localhost:3000/api/announcements/local/sync

# 프로덕션
curl -X POST https://govhelpers.com/api/announcements/local/sync
```

### Cron 스케줄

`vercel.json`:
```json
{
  "path": "/api/announcements/local/sync",
  "schedule": "0 4 * * *"  // 매일 04:00 UTC (13:00 KST)
}
```

### 동기화 로그 확인

관리자 대시보드에서 확인:
- URL: `/admin`
- 소스: `local`

또는 API로 확인:
```bash
curl https://govhelpers.com/api/admin/sync-status?source=local
```

---

## 에러 처리

스크래퍼는 다음과 같이 에러를 처리합니다:

```typescript
async scrape(options?: ScraperOptions): Promise<ScraperResult> {
  try {
    const announcements = await this.fetchAnnouncements()
    return {
      announcements,
      total: announcements.length,
      source: 'local_busan',
    }
  } catch (error) {
    console.error('[부산시 스크래퍼] 오류:', error)
    // 빈 결과 반환 (다른 지자체는 계속 진행)
    return {
      announcements: [],
      total: 0,
      source: 'local_busan',
    }
  }
}
```

에러가 발생해도 전체 동기화는 계속 진행됩니다.

---

## 날짜 파싱 유틸리티

다양한 날짜 형식을 YYYY-MM-DD로 변환:

```typescript
private parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined

  // "2026-01-28"
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }

  // "2026.01.28"
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateStr)) {
    return dateStr.replace(/\./g, '-')
  }

  // "20260128"
  if (/^\d{8}$/.test(dateStr)) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
  }

  // "~ 2026.01.28" (마감일만 추출)
  const match = dateStr.match(/~\s*(\d{4})[.\-\/](\d{2})[.\-\/](\d{2})/)
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }

  return undefined
}
```

---

## 참고 자료

### 공공데이터 포털
- https://www.data.go.kr
- 검색 키워드: "중소기업", "소상공인", "창업", "지원사업"

### 지자체 공식 사이트
| 지자체 | URL |
|--------|-----|
| 서울시 | https://www.seoul.go.kr |
| 경기도 | https://www.gg.go.kr |
| 부산시 | https://www.busan.go.kr |
| 대구시 | https://www.daegu.go.kr |

### 기술 스택
- **cheerio**: HTML 파싱 (설치됨)
- **rss-parser**: RSS 피드 파싱 (미설치, 필요 시 추가)
- **node-fetch**: HTTP 요청 (Next.js 내장)

---

## 작성자

- 작성일: 2026-01-28
- 작성자: Claude (Sisyphus-Junior)
- 버전: 1.0.0

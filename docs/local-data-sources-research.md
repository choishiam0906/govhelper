# 지자체 공공데이터 소스 조사 가이드

## 목적
서울시 및 경기도 스크래퍼를 실제로 동작시키기 위한 데이터 소스 조사 가이드입니다.

---

## 조사 대상

### 1. 서울시 (Seoul)

#### 조사할 사이트
| 사이트 | URL | 용도 |
|--------|-----|------|
| 서울 열린데이터 광장 | https://data.seoul.go.kr | 공공데이터 API |
| 서울시청 | https://www.seoul.go.kr | 지원사업 페이지 |
| 서울경제진흥원 | https://www.sba.seoul.kr | 중소기업 지원사업 |

#### 찾아야 할 정보
- [ ] 지원사업 공고 목록 API 엔드포인트
- [ ] API 인증 키 발급 방법
- [ ] RSS 피드 URL (있는 경우)
- [ ] 공고 목록 웹페이지 URL

#### 필요한 데이터 필드
- 공고 ID
- 공고 제목
- 지원 기관명
- 지원금액
- 접수 시작일
- 접수 마감일
- 상세보기 URL
- 공고 내용

#### 예상 API 엔드포인트 형식
```
https://openapi.seoul.go.kr/api/support-programs
  ?key={API_KEY}
  &type=json
  &service={SERVICE_NAME}
  &start_index=1
  &end_index=20
```

#### 조사 순서
1. 서울 열린데이터 광장에서 "지원사업" 검색
2. 관련 API 찾기
3. 샘플 데이터 확인
4. API 키 발급 신청
5. 응답 구조 분석

---

### 2. 경기도 (Gyeonggi)

#### 조사할 사이트
| 사이트 | URL | 용도 |
|--------|-----|------|
| 경기데이터드림 | https://data.gg.go.kr | 공공데이터 API |
| 경기도청 | https://www.gg.go.kr | 지원사업 페이지 |
| 경기도경제과학진흥원 | https://www.gbsa.or.kr | 중소기업 지원사업 |

#### 찾아야 할 정보
- [ ] 지원사업 공고 목록 API 엔드포인트
- [ ] API 인증 키 발급 방법
- [ ] RSS 피드 URL (있는 경우)
- [ ] 공고 목록 웹페이지 URL

#### 필요한 데이터 필드
- 사업 ID
- 사업명
- 부서명 (지원 기관)
- 지원규모
- 신청 시작일
- 신청 마감일
- 상세 URL
- 사업 개요

#### 예상 API 엔드포인트 형식
```
https://openapi.gg.go.kr/api/business-support
  ?KEY={API_KEY}
  &Type=json
  &pIndex=1
  &pSize=20
```

#### 조사 순서
1. 경기데이터드림에서 "중소기업 지원" 검색
2. 관련 API 찾기
3. 샘플 데이터 확인
4. API 키 발급 신청
5. 응답 구조 분석

---

## 공통 조사 항목

### API 스펙
- [ ] 인증 방식 (API Key, OAuth 등)
- [ ] 요청 제한 (Rate Limit)
- [ ] 응답 포맷 (JSON, XML)
- [ ] 페이지네이션 방식
- [ ] 에러 코드 및 처리

### 데이터 품질
- [ ] 업데이트 주기
- [ ] 데이터 정확도
- [ ] 과거 데이터 제공 범위
- [ ] 필수 필드 누락 여부

---

## 대체 방법

### 1. RSS 피드
지자체 공식 사이트에서 RSS 피드 제공 여부 확인

**장점:**
- 별도 API 키 불필요
- 실시간 업데이트
- 구현 간단 (rss-parser 사용)

**확인 방법:**
- 사이트 footer에 RSS 아이콘 확인
- `/rss`, `/feed` URL 직접 접근
- 페이지 소스에서 `<link rel="alternate" type="application/rss+xml">` 검색

### 2. HTML 스크래핑
API/RSS가 없는 경우 최후 수단

**장점:**
- 모든 사이트에 적용 가능
- 실시간 데이터

**단점:**
- 웹사이트 구조 변경 시 수정 필요
- robots.txt 준수 필요
- 성능 이슈 가능

**확인 사항:**
- [ ] robots.txt에서 크롤링 허용 여부
- [ ] 공고 목록 페이지 URL
- [ ] HTML 구조 (리스트 태그, 클래스명)
- [ ] 페이지네이션 방식

---

## 조사 결과 기록 양식

### 서울시

**데이터 소스:** [API / RSS / HTML 스크래핑]

**엔드포인트:**
```
URL:
인증: API Key 필요 / 불필요
응답 포맷: JSON / XML
```

**샘플 응답:**
```json
{
  "result": [
    {
      "id": "...",
      "title": "...",
      ...
    }
  ]
}
```

**API 키 발급:**
- 발급 사이트: https://...
- 발급 소요시간: 즉시 / N일
- 비고:

**필드 매핑:**
| 원본 필드 | ScraperAnnouncement 필드 |
|-----------|--------------------------|
| id | source_id |
| title | title |
| ... | ... |

---

### 경기도

**데이터 소스:** [API / RSS / HTML 스크래핑]

**엔드포인트:**
```
URL:
인증: API Key 필요 / 불필요
응답 포맷: JSON / XML
```

**샘플 응답:**
```json
{
  "data": [
    {
      "biz_id": "...",
      "biz_name": "...",
      ...
    }
  ]
}
```

**API 키 발급:**
- 발급 사이트: https://...
- 발급 소요시간: 즉시 / N일
- 비고:

**필드 매핑:**
| 원본 필드 | ScraperAnnouncement 필드 |
|-----------|--------------------------|
| biz_id | source_id |
| biz_name | title |
| ... | ... |

---

## 구현 예시

### API 방식 (권장)

```typescript
// lib/announcements/scrapers/seoul.ts

private async fetchAnnouncements(limit: number): Promise<ScraperAnnouncement[]> {
  const apiKey = process.env.SEOUL_DATA_API_KEY
  const url = `https://openapi.seoul.go.kr/api/support-programs?key=${apiKey}&type=json&limit=${limit}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const data = await response.json()

  return data.result.map(item => ({
    source_id: item.program_id,
    title: item.program_name,
    organization: '서울특별시',
    support_amount: item.support_scale,
    application_start: item.apply_start_date,
    application_end: item.apply_end_date,
    detail_url: item.detail_url,
    content: item.description,
  }))
}
```

### RSS 방식

```typescript
// npm install rss-parser 필요

import Parser from 'rss-parser'

private async fetchFromRss(limit: number): Promise<ScraperAnnouncement[]> {
  const parser = new Parser()
  const feed = await parser.parseURL('https://www.seoul.go.kr/rss/support.xml')

  return feed.items.slice(0, limit).map(item => ({
    source_id: item.guid || item.link,
    title: item.title,
    organization: '서울특별시',
    content: item.contentSnippet,
    detail_url: item.link,
    application_end: this.parseDate(item.pubDate),
  }))
}
```

### HTML 스크래핑 방식 (최후 수단)

```typescript
private async fetchFromWeb(limit: number): Promise<ScraperAnnouncement[]> {
  const url = 'https://www.seoul.go.kr/support/list'

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
      source_id: `SEOUL_${Date.now()}_${index}`,
      title: $el.find('.title').text().trim(),
      organization: '서울특별시',
      detail_url: this.buildUrl($el.find('a').attr('href')),
      application_end: this.parseDate($el.find('.date').text()),
    })
  })

  return announcements
}
```

---

## 환경변수 설정

`.env.local` 파일에 추가:

```bash
# 서울시 공공데이터 API
SEOUL_DATA_API_KEY=발급받은_API_키

# 경기도 공공데이터 API
GYEONGGI_DATA_API_KEY=발급받은_API_키
```

Vercel 프로덕션 환경에도 동일하게 설정 필요.

---

## 체크리스트

### 조사 단계
- [ ] 서울시 데이터 소스 확인
- [ ] 경기도 데이터 소스 확인
- [ ] API 키 발급 (필요한 경우)
- [ ] 샘플 응답 확인
- [ ] 필드 매핑 정의

### 구현 단계
- [ ] `seoul.ts` 스크래퍼 로직 완성
- [ ] `gyeonggi.ts` 스크래퍼 로직 완성
- [ ] 환경변수 설정
- [ ] 로컬 테스트
- [ ] Vercel 배포 및 검증

### 검증 단계
- [ ] 수동 트리거로 동기화 테스트
- [ ] 수집된 데이터 품질 확인
- [ ] 중복 감지 동작 확인
- [ ] AI 자동 분류 동작 확인
- [ ] 관리자 대시보드에서 로그 확인

---

## 참고 링크

### 공공데이터 포털
- 공공데이터포털: https://www.data.go.kr
- 서울 열린데이터 광장: https://data.seoul.go.kr
- 경기데이터드림: https://data.gg.go.kr

### 기술 문서
- cheerio 문서: https://cheerio.js.org
- rss-parser: https://github.com/rbren/rss-parser
- Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

---

## 작성자
- 작성일: 2026-01-28
- 작성자: Claude (Sisyphus-Junior)

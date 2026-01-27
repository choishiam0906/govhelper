# 지자체 지원사업 소스 구현 가이드

## 개요

지자체(광역시/도) 지원사업 데이터를 수집하기 위한 확장 가능한 인프라를 구축했습니다.

현재는 **구조만 구축**되어 있으며, 실제 데이터 수집은 개별 지자체 API/스크래퍼 활성화 시 추가할 수 있습니다.

---

## 구현된 파일

### 1. `lib/announcements/local-sources.ts`
지자체 소스 목록 및 설정 관리 파일.

**주요 기능:**
- 17개 광역시/도 정보 정의 (id, name, url, enabled, description)
- `getEnabledLocalSources()` - 활성화된 지자체 조회
- `getLocalSourceById(id)` - ID로 지자체 조회

**지자체 목록:**
| ID | 이름 | URL | 활성화 |
|----|------|-----|--------|
| `seoul` | 서울특별시 | https://www.seoul.go.kr | ❌ |
| `busan` | 부산광역시 | https://www.busan.go.kr | ❌ |
| `daegu` | 대구광역시 | https://www.daegu.go.kr | ❌ |
| `incheon` | 인천광역시 | https://www.incheon.go.kr | ❌ |
| `gwangju` | 광주광역시 | https://www.gwangju.go.kr | ❌ |
| `daejeon` | 대전광역시 | https://www.daejeon.go.kr | ❌ |
| `ulsan` | 울산광역시 | https://www.ulsan.go.kr | ❌ |
| `sejong` | 세종특별자치시 | https://www.sejong.go.kr | ❌ |
| `gyeonggi` | 경기도 | https://www.gg.go.kr | ❌ |
| `gangwon` | 강원특별자치도 | https://www.gangwon.go.kr | ❌ |
| `chungbuk` | 충청북도 | https://www.chungbuk.go.kr | ❌ |
| `chungnam` | 충청남도 | https://www.chungnam.go.kr | ❌ |
| `jeonbuk` | 전북특별자치도 | https://www.jeonbuk.go.kr | ❌ |
| `jeonnam` | 전라남도 | https://www.jeonnam.go.kr | ❌ |
| `gyeongbuk` | 경상북도 | https://www.gb.go.kr | ❌ |
| `gyeongnam` | 경상남도 | https://www.gyeongnam.go.kr | ❌ |
| `jeju` | 제주특별자치도 | https://www.jeju.go.kr | ❌ |

### 2. `app/api/announcements/local/sync/route.ts`
지자체 동기화 API 엔드포인트.

**현재 동작:**
- Cron 인증 및 Rate Limiting 처리
- 활성화된 지자체 소스 조회
- 활성화된 소스가 없으면 정상 종료
- 동기화 로그 저장 (DB: `sync_logs` 테이블)

**TODO (개별 지자체 활성화 시):**
```typescript
// app/api/announcements/local/sync/route.ts

for (const source of enabledSources) {
  switch (source.id) {
    case 'seoul':
      await syncSeoulAnnouncements(supabase)
      break
    case 'gyeonggi':
      await syncGyeonggiAnnouncements(supabase)
      break
    // ... 기타 지자체
  }
}
```

### 3. `vercel.json`
Cron job 설정 추가.

**새 Cron:**
```json
{
  "path": "/api/announcements/local/sync",
  "schedule": "0 4 * * *"  // 매일 04:00 UTC (13:00 KST)
}
```

**전체 동기화 스케줄:**
| 소스 | 시간 (UTC) | 시간 (KST) |
|------|------------|-----------|
| 중소벤처24 | 00:00, 12:00 | 09:00, 21:00 |
| 기업마당 | 01:00, 13:00 | 10:00, 22:00 |
| K-Startup | 02:00, 14:00 | 11:00, 23:00 |
| 나라장터 | 03:00, 15:00 | 12:00, 00:00 |
| **지자체** | **04:00** | **13:00** |

### 4. `app/api/admin/sync-status/route.ts`
관리자 동기화 상태 페이지에 'local' 소스 추가.

**수정 내용:**
```typescript
const sources = ['smes', 'bizinfo', 'kstartup', 'g2b', 'local']
```

---

## 개별 지자체 스크래퍼 추가 방법

### 1단계: 지자체 활성화
```typescript
// lib/announcements/local-sources.ts

{
  id: 'seoul',
  name: '서울특별시',
  url: 'https://www.seoul.go.kr',
  enabled: true,  // ✅ 활성화
  description: '서울시 중소기업 및 소상공인 지원사업'
}
```

### 2단계: 스크래퍼 함수 생성
```typescript
// lib/announcements/scrapers/seoul.ts

import { SupabaseClient } from '@supabase/supabase-js'
import { syncWithChangeDetection } from '@/lib/announcements/sync-with-changes'
import { detectDuplicate } from '@/lib/announcements/duplicate-detector'

export interface SeoulAnnouncement {
  id: string
  title: string
  organization: string
  supportAmount: string
  applicationStart: string
  applicationEnd: string
  detailUrl: string
  // ... 기타 필드
}

/**
 * 서울시 지원사업 동기화
 */
export async function syncSeoulAnnouncements(
  supabase: SupabaseClient
): Promise<{ upserted: number; changesDetected: number }> {

  // 1. 서울시 API/웹사이트에서 데이터 수집
  const announcements = await fetchSeoulAnnouncements()

  // 2. DB 형식으로 변환
  const announcementsToUpsert = []

  for (const item of announcements) {
    const announcement = {
      source: 'local_seoul',  // source 필드 형식: local_{지자체ID}
      source_id: item.id,
      title: item.title,
      organization: item.organization,
      category: '지자체',
      support_type: '서울시',
      target_company: '',
      support_amount: item.supportAmount,
      application_start: item.applicationStart,
      application_end: item.applicationEnd,
      content: `상세보기: ${item.detailUrl}`,
      status: 'active',
      updated_at: new Date().toISOString()
    }

    // 3. 중복 감지
    const duplicateResult = await detectDuplicate(
      announcement.title,
      announcement.organization,
      announcement.source,
      supabase
    )

    if (duplicateResult.isDuplicate) {
      console.log(`[중복 스킵] ${announcement.title}`)
      continue
    }

    announcementsToUpsert.push(announcement)
  }

  // 4. 배치 upsert + 변경 감지
  const syncResult = await syncWithChangeDetection(supabase, announcementsToUpsert)

  return syncResult
}

/**
 * 서울시 API에서 공고 목록 가져오기
 */
async function fetchSeoulAnnouncements(): Promise<SeoulAnnouncement[]> {
  // TODO: 실제 API 호출 또는 웹 스크래핑
  // 예시: 공공데이터포털 API, RSS 피드, 웹사이트 HTML 파싱 등

  const response = await fetch('https://...seoul-api-url...')
  const data = await response.json()

  return data.items
}
```

### 3단계: 동기화 API에 통합
```typescript
// app/api/announcements/local/sync/route.ts

import { syncSeoulAnnouncements } from '@/lib/announcements/scrapers/seoul'
import { syncGyeonggiAnnouncements } from '@/lib/announcements/scrapers/gyeonggi'
// ... 기타 지자체 import

// 활성화된 각 지자체별 스크래퍼 실행
for (const source of enabledSources) {
  try {
    let result

    switch (source.id) {
      case 'seoul':
        result = await syncSeoulAnnouncements(supabase)
        break
      case 'gyeonggi':
        result = await syncGyeonggiAnnouncements(supabase)
        break
      // ... 기타 지자체
      default:
        console.log(`[스킵] ${source.name} 스크래퍼가 아직 구현되지 않았어요`)
        continue
    }

    console.log(`[완료] ${source.name}: ${result.upserted}건 추가, ${result.changesDetected}건 변경`)

  } catch (error) {
    console.error(`[오류] ${source.name} 동기화 실패:`, error)
  }
}
```

---

## 데이터 소스 형식

각 지자체 공고의 `source` 필드는 다음 형식을 따릅니다:

| 지자체 | source 필드 | 예시 |
|--------|------------|------|
| 서울시 | `local_seoul` | `local_seoul` |
| 경기도 | `local_gyeonggi` | `local_gyeonggi` |
| 부산시 | `local_busan` | `local_busan` |
| ... | `local_{지자체ID}` | ... |

**announcements 테이블 예시:**
```sql
INSERT INTO announcements (
  source,
  source_id,
  title,
  organization,
  category,
  support_type,
  application_start,
  application_end,
  status
) VALUES (
  'local_seoul',
  'SEOUL2026001',
  '서울시 소상공인 디지털 전환 지원사업',
  '서울특별시',
  '지자체',
  '서울시',
  '2026-02-01',
  '2026-02-28',
  'active'
);
```

---

## 데이터 수집 방법

### 방법 1: 공공데이터포털 API
일부 지자체는 공공데이터포털에 API를 제공합니다.

**예시 (경기도 공공데이터):**
```typescript
const API_KEY = process.env.GYEONGGI_DATA_API_KEY
const response = await fetch(
  `https://openapi.gg.go.kr/...?KEY=${API_KEY}`
)
```

### 방법 2: RSS 피드
일부 지자체는 RSS 피드를 제공합니다.

```typescript
import Parser from 'rss-parser'

const parser = new Parser()
const feed = await parser.parseURL('https://www.seoul.go.kr/rss/...')

for (const item of feed.items) {
  console.log(item.title, item.link)
}
```

### 방법 3: 웹 스크래핑
API가 없는 경우 HTML 파싱으로 수집합니다.

```typescript
import * as cheerio from 'cheerio'

const html = await fetch('https://www.seoul.go.kr/...').then(r => r.text())
const $ = cheerio.load(html)

$('.announcement-list .item').each((i, el) => {
  const title = $(el).find('.title').text()
  const link = $(el).find('a').attr('href')
  // ...
})
```

**주의사항:**
- 웹사이트 구조 변경 시 스크래퍼 수정 필요
- robots.txt 확인 및 요청 간격(1초 이상) 준수
- User-Agent 헤더 명시 권장

---

## 테스트

### 수동 트리거
```bash
curl -X POST http://localhost:3000/api/announcements/local/sync
```

### 특정 지자체 활성화 테스트
1. `lib/announcements/local-sources.ts`에서 `enabled: true` 설정
2. 스크래퍼 함수 구현
3. 동기화 API에 통합
4. 수동 트리거로 테스트
5. Supabase에서 `announcements` 테이블 확인

---

## 관리자 페이지 확인

동기화 상태는 다음 페이지에서 확인할 수 있습니다:

**관리자 대시보드:**
- URL: `/admin`
- 'local' 소스 동기화 통계 표시

**API 엔드포인트:**
```bash
# 전체 소스 현황
GET /api/admin/sync-status

# 지자체 소스 상세 로그
GET /api/admin/sync-status?source=local
```

---

## 향후 개선 사항

### 우선순위 높음
- [ ] 서울시 스크래퍼 구현 (서울시 테크노파크 API 활용)
- [ ] 경기도 스크래퍼 구현 (경기도 공공데이터 API 활용)

### 우선순위 중간
- [ ] 부산시 스크래퍼 구현
- [ ] 대구시 스크래퍼 구현
- [ ] 인천시 스크래퍼 구현

### 우선순위 낮음
- [ ] 나머지 12개 광역시/도 스크래퍼 구현
- [ ] 시군구 단위 지원사업 확장 (226개 시군구)

---

## 참고 자료

**공공데이터포털:**
- https://www.data.go.kr
- 지자체별 API 검색 키워드: "중소기업", "소상공인", "창업", "지원사업"

**지자체 공식 사이트:**
- 서울시: https://www.seoul.go.kr
- 경기도: https://www.gg.go.kr
- 부산시: https://www.busan.go.kr

**기술 스택:**
- cheerio: HTML 파싱
- rss-parser: RSS 피드 파싱
- node-fetch: HTTP 요청

---

## 작성자

- 작성일: 2026-01-27
- 작성자: Claude (Sisyphus-Junior)

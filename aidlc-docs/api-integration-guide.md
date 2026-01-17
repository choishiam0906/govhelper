# GovHelper API 연동 가이드

> 작성일: 2026-01-17
> 버전: 1.0

---

## 개요

GovHelper는 여러 정부 공공 API를 통합하여 중소기업/스타트업에게 지원사업 정보를 제공합니다.

---

## 연동된 API 목록

| API | 소스 | 데이터 | 동기화 주기 |
|-----|------|--------|-------------|
| 중소벤처24 (SMES) | smes24 | 정부지원사업 공고 | 매일 00:00, 12:00 |
| 기업마당 (bizinfo) | bizinfo | 중기부 지원사업 | 매일 01:00, 13:00 |
| K-Startup | kstartup | 창업 지원사업 | 매일 02:00, 14:00 |
| 국세청 | nts | 사업자등록정보 검증 | 실시간 |

---

## 1. 중소벤처24 (SMES) API

### 개요
- **제공처**: 중소벤처기업부
- **데이터**: 정부지원사업 공고
- **형식**: JSON

### 엔드포인트
```
GET  /api/announcements/smes        # 공고 조회
POST /api/announcements/smes/sync   # DB 동기화
```

### 환경 변수
```bash
SMES_API_TOKEN=중소벤처24에서_발급받은_토큰
```

### API 발급
1. [중소벤처24](https://www.smes.go.kr) 접속
2. 회원가입 및 API 신청
3. 토큰 발급

---

## 2. 기업마당 (bizinfo) API

### 개요
- **제공처**: 기업마당 (bizinfo.go.kr)
- **데이터**: 중소기업 지원사업 공고
- **형식**: JSON

### 엔드포인트
```
GET  /api/announcements/bizinfo        # 공고 조회
POST /api/announcements/bizinfo/sync   # DB 동기화
```

### 쿼리 파라미터
| 파라미터 | 설명 | 기본값 |
|----------|------|--------|
| page | 페이지 번호 | 1 |
| limit | 페이지당 건수 | 50 |
| activeOnly | 진행중 공고만 | true |

### 환경 변수
```bash
BIZINFO_API_KEY=기업마당에서_발급받은_인증키
```

### API 발급
1. [기업마당 API 신청](https://www.bizinfo.go.kr/web/lay1/program/S1T175C174/apiDetail.do?id=bizinfoApi) 접속
2. 기관명, 신청자명, 이메일, 전화번호, 시스템명, IP/URL 입력
3. 인증키(crtfcKey) 발급

### 응답 예시
```json
{
  "success": true,
  "data": [
    {
      "id": "PBLN_000000000117535",
      "title": "[충북] 청주시 2026년 중소기업육성자금 융자 지원계획 공고",
      "organization": "충청북도",
      "bizType": "금융",
      "sportType": "융자",
      "startDate": "",
      "endDate": "",
      "targetScale": "중소기업",
      "detailUrl": "https://www.bizinfo.go.kr/...",
      "content": "...",
      "source": "bizinfo"
    }
  ],
  "meta": {
    "total": 631,
    "returned": 50,
    "page": 1,
    "limit": 50
  }
}
```

---

## 3. K-Startup API

### 개요
- **제공처**: 공공데이터포털 (창업진흥원)
- **데이터**: 창업 지원사업 공고
- **형식**: JSON

### 엔드포인트
```
GET  /api/announcements/kstartup        # 공고 조회
POST /api/announcements/kstartup/sync   # DB 동기화
```

### 쿼리 파라미터
| 파라미터 | 설명 | 기본값 |
|----------|------|--------|
| page | 페이지 번호 | 1 |
| limit | 페이지당 건수 | 50 |
| category | 지원분야 필터 | - |
| activeOnly | 진행중 공고만 | true |

### 환경 변수
```bash
KSTARTUP_API_KEY=공공데이터포털에서_발급받은_서비스키
```

### API 발급
1. [공공데이터포털](https://www.data.go.kr/data/15125364/openapi.do) 접속
2. 회원가입 / 로그인
3. "활용신청" 버튼 클릭
4. 활용 목적 작성 후 신청
5. 승인 후 서비스키(Encoding) 복사

### 지원분야 코드
| 분야 | 설명 |
|------|------|
| 시설·공간·보육 | 창업 공간 지원 |
| 멘토링·컨설팅 | 전문가 멘토링 |
| 사업화 | 사업화 자금 |
| R&D | 연구개발 지원 |
| 판로·해외진출 | 수출/판로 지원 |
| 인력 | 인력 채용 지원 |
| 융자 | 융자 지원 |
| 행사·네트워크 | 행사/네트워킹 |

---

## 4. 국세청 사업자등록정보 API

### 개요
- **제공처**: 공공데이터포털 (국세청)
- **데이터**: 사업자등록 진위확인
- **형식**: JSON

### 엔드포인트
```
POST /api/business/verify
```

### 요청 본문
```json
{
  "businessNumber": "1234567890"
}
```

### 환경 변수
```bash
NTS_API_KEY=공공데이터포털에서_발급받은_서비스키
```

---

## Vercel Cron 설정

`vercel.json`에 자동 동기화 스케줄이 설정되어 있습니다:

```json
{
  "crons": [
    { "path": "/api/announcements/smes/sync", "schedule": "0 0 * * *" },
    { "path": "/api/announcements/smes/sync", "schedule": "0 12 * * *" },
    { "path": "/api/announcements/bizinfo/sync", "schedule": "0 1 * * *" },
    { "path": "/api/announcements/bizinfo/sync", "schedule": "0 13 * * *" },
    { "path": "/api/announcements/kstartup/sync", "schedule": "0 2 * * *" },
    { "path": "/api/announcements/kstartup/sync", "schedule": "0 14 * * *" }
  ]
}
```

### Cron 시간 (UTC → KST)
| API | UTC | KST |
|-----|-----|-----|
| SMES | 00:00, 12:00 | 09:00, 21:00 |
| bizinfo | 01:00, 13:00 | 10:00, 22:00 |
| K-Startup | 02:00, 14:00 | 11:00, 23:00 |

---

## 수동 동기화

```bash
# 중소벤처24
curl -X POST https://govhelpers.com/api/announcements/smes/sync

# 기업마당
curl -X POST https://govhelpers.com/api/announcements/bizinfo/sync

# K-Startup
curl -X POST https://govhelpers.com/api/announcements/kstartup/sync
```

---

## 데이터베이스 스키마

공고 데이터는 `announcements` 테이블에 저장됩니다:

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| source | text | 데이터 소스 (smes24, bizinfo, kstartup) |
| source_id | text | 원본 API의 공고 ID |
| title | text | 공고명 |
| organization | text | 소관기관 |
| category | text | 분야 |
| support_type | text | 지원유형 |
| target_company | text | 지원대상 |
| application_start | date | 접수 시작일 |
| application_end | date | 접수 종료일 |
| content | text | 공고 내용 |
| status | text | 상태 (active, expired) |
| created_at | timestamp | 생성일시 |
| updated_at | timestamp | 수정일시 |

### Unique Constraint
```sql
UNIQUE (source, source_id)
```

---

## 트러블슈팅

### API 키 오류
```
"error": "API 키가 설정되지 않았어요"
```
→ `.env.local`에 해당 API 키가 설정되어 있는지 확인

### 동기화 실패
```
"error": "동기화 중 오류가 발생했어요"
```
→ API 제공처 서버 상태 확인
→ API 키 유효성 확인
→ 요청 제한(Rate Limit) 확인

### 데이터 중복
→ `source` + `source_id` 조합으로 UPSERT 처리됨
→ 중복 데이터는 자동으로 업데이트됨

---

## 향후 연동 예정

| API | 제공처 | 데이터 |
|-----|--------|--------|
| 나라장터 (G2B) | 조달청 | 입찰공고 |
| HRD Korea | 고용노동부 | 훈련과정 |

---

## 참고 링크

- [중소벤처24](https://www.smes.go.kr)
- [기업마당](https://www.bizinfo.go.kr)
- [K-Startup](https://www.k-startup.go.kr)
- [공공데이터포털](https://www.data.go.kr)

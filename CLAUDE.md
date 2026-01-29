# CLAUDE.md - GovHelper 프로젝트 가이드

이 파일은 Claude Code가 GovHelper 프로젝트 컨텍스트를 이해하고 효율적으로 작업하도록 안내합니다.

> **작업 목록**: 진행 예정/완료 작업은 `todolist.md` 참조

---

## 프로젝트 개요

**GovHelper**는 중소기업과 스타트업을 위한 AI 기반 정부지원사업 매칭 및 지원서 작성 도우미 SaaS 플랫폼입니다.

| 항목 | 내용 |
|------|------|
| **라이브 URL** | https://govhelpers.com |
| **GitHub** | https://github.com/choishiam0906/govhelper |
| **상태** | 프로덕션 운영 중 |

---

## 핵심 기능

- **통합 공고 검색**: 중소벤처24, 나라장터, 기업마당, K-Startup 공고 통합
- **AI 자동 분류**: 공고 동기화 시 Gemini AI가 지원자격 자동 파싱 및 구조화
- **AI 매칭 분석**: 기업 정보 기반 0-100점 매칭 점수 제공
- **AI 지원서 작성**: 지원서 초안 자동 생성 및 섹션별 개선
- **결제/구독**: Toss Payments 연동, Free/Pro/Premium 3단계 플랜

---

## 기술 스택

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js (App Router) | 16.1.1 |
| **Frontend** | React | 19.2.3 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | Radix UI + Shadcn | Latest |
| **Database** | Supabase (PostgreSQL) | Latest |
| **Auth** | Supabase Auth | Latest |
| **AI** | Google Gemini 2.5 Flash | Latest |
| **Embedding** | Gemini text-embedding-004 | 768차원 |
| **Vector DB** | pgvector (PostgreSQL) | Latest |
| **Payments** | Toss Payments SDK | 1.9.2 |
| **State** | Zustand | 5.0.9 |
| **Forms** | React Hook Form + Zod | 7.x / 4.x |
| **Email** | Resend | 6.7.0 |
| **Hosting** | Vercel | - |

---

## 디렉토리 구조

```
govhelper-main/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 및 정적 페이지
│   ├── (dashboard)/              # 대시보드 페이지
│   ├── admin/                    # 관리자 페이지
│   ├── api/                      # API Routes
│   └── try/                      # 비회원 매칭 플로우
├── components/                   # 공통 컴포넌트
│   ├── ui/                       # Shadcn UI 컴포넌트
│   └── ...
├── lib/                          # 유틸리티 및 설정
│   ├── ai/                       # Gemini AI 로직
│   ├── email/                    # Resend 이메일
│   ├── payments/                 # Toss Payments
│   ├── queries/                  # Supabase 쿼리
│   └── supabase/                 # Supabase 클라이언트
├── types/                        # TypeScript 타입 정의
├── supabase/migrations/          # DB 마이그레이션
├── e2e/                          # Playwright E2E 테스트
├── __tests__/                    # Vitest 유닛 테스트
└── scripts/                      # 유틸리티 스크립트
```

---

## 환경 변수

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
GOOGLE_GENERATIVE_AI_API_KEY=

# Payments (Toss)
TOSS_PAYMENTS_CLIENT_KEY=
TOSS_PAYMENTS_SECRET_KEY=

# External APIs
SMES_API_TOKEN=           # 중소벤처24 API
BIZINFO_API_KEY=          # 기업마당 API
KSTARTUP_API_KEY=         # K-Startup API
G2B_API_KEY=              # 나라장터 API
NTS_API_KEY=              # 국세청 사업자등록정보

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Email
RESEND_API_KEY=

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Error Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://govhelpers.com
ADMIN_EMAILS=             # 쉼표로 구분된 관리자 이메일
```

---

## 개발 명령어

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 프로덕션 시작
npm run start

# 테스트
npm run test              # Vitest 실행
npm run test:run          # Vitest 1회 실행
npm run test:coverage     # 커버리지 포함
npm run test:e2e          # Playwright E2E 테스트
npm run test:e2e:ui       # Playwright UI 모드

# 분석
npm run analyze           # 번들 크기 분석
npm run lighthouse        # Lighthouse CI 실행

# 린트
npm run lint

# 마이그레이션
npm run migrate           # 미실행 마이그레이션 순서대로 실행
npm run migrate:status    # 마이그레이션 상태 확인
npm run migrate:create    # 새 마이그레이션 파일 생성
```

---

## API 엔드포인트 (주요)

> **API 문서**: Swagger UI → [/api-docs](https://govhelpers.com/api-docs) | OpenAPI JSON → [/api/docs/openapi.json](https://govhelpers.com/api/docs/openapi.json)

### 공고 (Announcements)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/announcements` | 공고 검색 (필터링, 페이지네이션) |
| `GET` | `/api/announcements/[id]` | 공고 상세 |
| `POST` | `/api/announcements/search` | AI 시맨틱/하이브리드 검색 |

### 검색 (Search)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search/autocomplete` | 검색어 자동완성 (인기/최근/공고 매칭) |
| `POST` | `/api/search/record` | 검색어 기록 |

### AI 매칭 (Matching)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/matching` | AI 매칭 분석 요청 |
| `POST` | `/api/matching/stream` | AI 매칭 스트리밍 (SSE) |
| `GET` | `/api/recommendations` | 맞춤 공고 추천 - 하이브리드 (규칙+행동 기반) (Pro/Premium) |
| `POST` | `/api/announcements/[id]/view` | 공고 조회 이벤트 기록 (fire-and-forget) |
| `POST` | `/api/matching/[id]/feedback` | 매칭 정확도 피드백 제출 (별점/방향성/결과) |
| `GET` | `/api/matching/[id]/feedback` | 매칭 피드백 조회 |
| `GET` | `/api/admin/match-feedback` | 관리자 피드백 통계 |

### 지원서 (Applications)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/applications` | 지원서 목록/생성 |
| `POST` | `/api/applications/stream` | AI 지원서 생성 (SSE) |
| `POST` | `/api/applications/[id]/improve` | AI 섹션 개선 |

### 결제/구독 (Payments)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/toss/confirm` | Toss 결제 확인 |
| `GET/POST` | `/api/subscriptions` | 구독 관리 |

### 비회원 매칭 (Guest)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/guest/matching` | 비회원 AI 매칭 |
| `GET` | `/api/guest/matching/[id]` | 결과 조회 (블러 처리) |

---

## 코드 컨벤션

### UX 라이팅 (토스 스타일)
- 모든 문구는 **해요체** 사용
- 능동형 표현: "저장됐어요" → "저장했어요"
- 긍정형 표현: "없어요" → "있어요"
- "돼요" 통일: "되어요" → "돼요"

### 접근성 (A11y)
- 버튼/링크에 명확한 레이블 제공
- 이미지에 alt 텍스트 필수
- 키보드 네비게이션 지원

### 커밋 메시지
- 한글 자유 형식
- 예시: `로그인 기능 추가`, `버그 수정: 결제 오류 해결`

---

## 외부 API 연동

### Cron 동기화 스케줄
| API | Cron (UTC) |
|-----|------------|
| 중소벤처24 (SMES) | 00:00, 12:00 |
| 기업마당 (bizinfo) | 01:00, 13:00 |
| K-Startup | 02:00, 14:00 |
| 나라장터 (G2B) | 03:00, 15:00 |

### 외부 서비스
| 서비스 | 용도 |
|--------|------|
| Google Gemini | AI 분석/생성 |
| Toss Payments | 결제 |
| Resend | 이메일 |
| Supabase | DB/Auth |
| Upstash Redis | Rate Limiting |
| Sentry | 에러 모니터링 |

---

## 데이터베이스 (주요 테이블)

| 테이블 | 설명 |
|--------|------|
| `companies` | 기업 정보 |
| `announcements` | 정부지원사업 공고 |
| `announcement_embeddings` | 공고 벡터 임베딩 (768차원) |
| `matches` | AI 매칭 결과 |
| `applications` | 지원서 |
| `subscriptions` | 구독 정보 |
| `payments` | 결제 내역 |
| `guest_leads` | 비회원 리드 |
| `guest_matches` | 비회원 매칭 결과 |
| `search_queries` | 검색어 기록 (자동완성용) |
| `user_announcement_views` | 공고 조회 이력 (추천 알고리즘용) |
| `_migrations` | 마이그레이션 실행 이력 추적 |
| `match_feedback` | 매칭 정확도 피드백 (별점, 방향성, 실제 결과) |

### eligibility_criteria (공고 자격요건 JSONB)
```json
{
  "companyTypes": ["중소기업", "스타트업"],
  "employeeCount": { "min": 5, "max": 300 },
  "revenue": { "max": 10000000000 },
  "businessAge": { "max": 7 },
  "industries": { "included": ["제조업"], "excluded": ["금융업"] },
  "regions": { "included": ["전국"] },
  "requiredCertifications": ["벤처인증"],
  "confidence": 0.85
}
```

---

## Supabase 설정

### Authentication > URL Configuration
| 설정 | 값 |
|------|-----|
| Site URL | `https://govhelpers.com` |
| Redirect URLs | `https://govhelpers.com/auth/callback` |

### OAuth Providers
- Google OAuth
- Kakao OAuth

### Storage 버킷
| 버킷명 | 용도 | Public |
|--------|------|--------|
| `business-plans` | 사업계획서 | 비공개 |
| `company-documents` | 기업 문서 | 비공개 |

---

## 참고 링크

- [todolist.md](./todolist.md) - 작업 목록 및 진행 상황
- [공공데이터포털](https://www.data.go.kr/)
- [Toss UX 가이드](https://toss.im/career/article/toss-product-language)

---

*GovHelper - AI 기반 정부지원사업 매칭 플랫폼*

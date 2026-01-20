# CLAUDE.md - GovHelper 프로젝트 가이드

이 파일은 Claude Code가 GovHelper 프로젝트 컨텍스트를 이해하고 효율적으로 작업하도록 안내합니다.

---

## 프로젝트 개요

**GovHelper**는 중소기업과 스타트업을 위한 AI 기반 정부지원사업 매칭 및 지원서 작성 도우미 SaaS 플랫폼입니다.

| 항목 | 내용 |
|------|------|
| **라이브 URL** | https://govhelpers.com |
| **GitHub** | https://github.com/choishiam0906/govhelper |
| **진행도** | 95% 완성 |
| **상태** | 프로덕션 운영 중 |

---

## 핵심 기능

- **통합 공고 검색**: 중소벤처24, 나라장터, 기업마당, K-Startup 공고 통합
- **AI 자동 분류**: 공고 동기화 시 Gemini AI가 지원자격 자동 파싱 및 구조화
- **AI 매칭 분석**: 기업 정보 기반 0-100점 매칭 점수 제공
- **AI 지원서 작성**: 지원서 초안 자동 생성 및 섹션별 개선
- **결제/구독**: Toss Payments 연동, Free/Pro 플랜

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
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── about/                # 서비스 소개
│   │   ├── terms/                # 이용약관
│   │   └── privacy/              # 개인정보처리방침
│   ├── (dashboard)/              # 대시보드 페이지
│   │   ├── dashboard/
│   │   │   ├── announcements/    # 공고 검색/상세
│   │   │   ├── matching/         # AI 매칭
│   │   │   ├── applications/     # 지원서 관리
│   │   │   ├── billing/          # 결제/구독
│   │   │   └── profile/          # 기업 프로필
│   │   └── onboarding/           # 온보딩
│   ├── admin/                    # 관리자 페이지
│   │   ├── approvals/            # 미등록 사업자 승인
│   │   ├── users/
│   │   └── payments/
│   ├── api/                      # API Routes
│   │   ├── announcements/
│   │   ├── companies/
│   │   ├── matching/
│   │   ├── applications/
│   │   ├── payments/
│   │   ├── subscriptions/
│   │   └── business/             # 사업자 검증
│   ├── layout.tsx
│   └── page.tsx                  # 랜딩 페이지
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
├── supabase/
│   └── migrations/               # DB 마이그레이션
├── scripts/                      # 유틸리티 스크립트
└── public/                       # 정적 파일
```

---

## API 엔드포인트

### 공고 (Announcements)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/announcements` | 공고 검색 (필터링, 페이지네이션) |
| `GET` | `/api/announcements/[id]` | 공고 상세 |
| `POST` | `/api/announcements/search` | AI 시맨틱 검색 (pgvector) |
| `GET` | `/api/announcements/search` | 검색 통계 및 추천 검색어 |
| `GET` | `/api/announcements/smes` | 중소벤처24 공고 조회 |
| `POST` | `/api/announcements/smes/sync` | 중소벤처24 동기화 (Cron 00:00, 12:00) |
| `GET` | `/api/announcements/bizinfo` | 기업마당 공고 조회 |
| `POST` | `/api/announcements/bizinfo/sync` | 기업마당 동기화 (Cron 01:00, 13:00) |
| `GET` | `/api/announcements/kstartup` | K-Startup 공고 조회 |
| `POST` | `/api/announcements/kstartup/sync` | K-Startup 동기화 (Cron 02:00, 14:00) |
| `GET` | `/api/announcements/parse-eligibility?id=` | 지원자격 AI 파싱 (단일) |
| `POST` | `/api/announcements/parse-eligibility` | 지원자격 AI 파싱 (배치) |

### 임베딩 (Embeddings)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/embeddings/generate` | 공고 임베딩 생성 (관리자 전용) |
| `GET` | `/api/embeddings/generate` | 임베딩 현황 조회 (관리자 전용) |

### 기업 (Companies)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/companies` | 기업 목록/생성 |
| `GET/PUT/DELETE` | `/api/companies/[id]` | 기업 CRUD |

### AI 매칭 (Matching)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/matching` | AI 매칭 분석 요청 |
| `GET/DELETE` | `/api/matching/[id]` | 매칭 결과 조회/삭제 |

### 지원서 (Applications)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/applications` | 지원서 목록/생성 |
| `GET/PUT/DELETE` | `/api/applications/[id]` | 지원서 CRUD |
| `POST` | `/api/applications/[id]/improve` | AI 섹션 개선 |

### 결제/구독 (Payments & Subscriptions)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/toss/confirm` | Toss 결제 확인 |
| `GET/POST` | `/api/subscriptions` | 구독 관리 |
| `POST` | `/api/subscriptions/cancel` | 구독 취소 |

### 사업자 검증
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/business/verify` | 국세청 사업자등록정보 검증 |

### 파일 업로드
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload/business-plan` | 사업계획서 PDF 업로드 (비공개 버킷) |

### 관리자 (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/approvals` | 미등록 사업자 승인 대기 목록 |
| `POST` | `/api/admin/approvals` | 미등록 사업자 승인/거절 처리 |
| `GET` | `/api/admin/users` | 사용자 목록 조회 |
| `GET` | `/api/admin/payments` | 결제 내역 조회 |

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
BIZINFO_API_KEY=          # 기업마당 API (기업마당에서 발급)
KSTARTUP_API_KEY=         # K-Startup API (공공데이터포털에서 발급)
NTS_API_KEY=              # 국세청 사업자등록정보

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=   # Upstash 콘솔에서 발급
UPSTASH_REDIS_REST_TOKEN= # Upstash 콘솔에서 발급

# Email
RESEND_API_KEY=

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

# 린트
npm run lint
```

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

### 다크패턴 방지
- 숨겨진 비용 금지
- 취소/해지 버튼 명확히 표시
- 긴급성 압박 금지

### 커밋 메시지
- 한글 자유 형식
- 예시: `로그인 기능 추가`, `버그 수정: 결제 오류 해결`

---

## 데이터베이스 스키마

### 주요 테이블
- `companies`: 기업 정보 (미등록 사업자 승인 관련 컬럼 포함)
- `announcements`: 정부지원사업 공고 (eligibility_criteria JSONB 포함)
- `announcement_embeddings`: 공고 벡터 임베딩 (pgvector, 768차원)
- `matches`: AI 매칭 결과
- `applications`: 지원서
- `payments`: 결제 내역
- `subscriptions`: 구독 정보

### companies 테이블 스키마
```sql
-- 기본 컬럼
id, user_id, name, business_number, industry, employee_count,
founded_date, location, certifications, annual_revenue, description

-- 미등록 사업자 관련 컬럼 (2026-01-19 추가)
is_registered_business BOOLEAN DEFAULT true,  -- 사업자등록 여부
business_plan_url TEXT,                        -- 사업계획서 경로 (Storage)
approval_status TEXT DEFAULT 'approved'        -- 승인상태: pending/approved/rejected
```

### eligibility_criteria 스키마
공고의 지원자격을 AI가 파싱한 구조화된 데이터:
```json
{
  "companyTypes": ["중소기업", "스타트업"],
  "employeeCount": { "min": 5, "max": 300, "description": "상시근로자 5인 이상" },
  "revenue": { "min": null, "max": 10000000000, "description": "연매출 100억 이하" },
  "businessAge": { "min": null, "max": 7, "description": "창업 7년 이내" },
  "industries": { "included": ["제조업"], "excluded": ["금융업"] },
  "regions": { "included": ["전국"], "excluded": [] },
  "requiredCertifications": ["벤처인증"],
  "additionalRequirements": ["고용보험 가입"],
  "exclusions": ["세금 체납 기업"],
  "summary": "창업 7년 이내 중소기업 대상",
  "confidence": 0.85,
  "parsedAt": "2026-01-18T00:00:00.000Z"
}
```

### announcement_embeddings 테이블 스키마
```sql
-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 공고 임베딩 테이블
CREATE TABLE announcement_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  embedding VECTOR(768),      -- Gemini text-embedding-004 (768차원)
  content_hash TEXT,          -- 변경 감지용 MD5 해시
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(announcement_id)
);

-- IVFFlat 인덱스 (빠른 근사 검색)
CREATE INDEX idx_embeddings_ivfflat ON announcement_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### RLS (Row Level Security)
모든 테이블에 RLS 적용됨. 사용자는 자신의 데이터만 접근 가능.

### Supabase Storage 버킷
| 버킷명 | 용도 | Public | 파일 형식 |
|--------|------|--------|----------|
| `business-plans` | 미등록 사업자 사업계획서 | 비공개 | PDF (10MB 제한) |

**Storage RLS 정책:**
```sql
-- 사용자는 자신의 폴더에만 업로드/조회 가능
CREATE POLICY "Users can upload their own business plans"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'business-plans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own business plans"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-plans' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 외부 API 연동 현황

### 정부 공공 API
| API | 용도 | Cron | 상태 |
|-----|------|------|------|
| 중소벤처24 (SMES) | 정부지원사업 공고 | 00:00, 12:00 | ✅ 완료 |
| 기업마당 (bizinfo) | 중기부 지원사업 | 01:00, 13:00 | ✅ 완료 |
| K-Startup | 창업 지원사업 | 02:00, 14:00 | ✅ 완료 |
| 국세청 사업자등록정보 | 사업자번호 검증 | - | ✅ 완료 |
| 나라장터 (G2B) | 조달청 입찰공고 | 03:00, 15:00 | ⚠️ 401 오류 (API 키 재발급 필요) |
| HRD Korea | 고용노동부 훈련 | - | 📋 API 키 미설정 (`HRD_AUTH_KEY`) |

### 외부 서비스 API
| API | 용도 | 상태 |
|-----|------|------|
| Google Gemini | AI 분석/생성 | ✅ 완료 |
| Toss Payments | 결제 | ✅ 완료 |
| Resend | 이메일 알림 | ✅ 완료 |
| Supabase | DB/인증 | ✅ 완료 |
| Google OAuth | 소셜 로그인 | ✅ 완료 |
| Kakao OAuth | 소셜 로그인 | ✅ 완료 |

---

## 진행 예정 작업

### P0 - 완료
- [x] 다크패턴 방지 점검 (완료)
- [x] 반응형 디자인 점검 (375px) (완료)
- [x] alert() → toast 교체 (완료 - sonner)
- [x] OAuth 로그인 설정 (완료 - 2026-01-20)
- [x] 관리자 페이지 사용자 목록 (완료 - 2026-01-20)
- [x] 랜딩 페이지 404 링크 수정 (완료 - 2026-01-20)

### P1 - 단기 (완료)
- [x] PDF 다운로드 (완료)
- [x] Rate Limiting (완료 - Upstash Redis)
- [x] 첨부파일 스크래핑 (완료)
- [x] 지원자격 AI 상세 파싱 (완료 - Gemini 2.5 Flash)
- [x] 공고 상세 페이지 원본 바로가기 (완료 - 2026-01-19)
- [x] 소스별 탭 내부 상세 페이지 연동 (완료 - 2026-01-19)
- [x] LLM 응답 스트리밍 (SSE) (완료 - 2026-01-20)
- [x] 이메일 알림 기능 (완료 - 2026-01-20)
- [x] 미등록 사업자 승인 프로세스 (완료 - 2026-01-19)
- [x] 랜딩 페이지 프로모션 배너 (완료 - 2026-01-19)
- [x] 동기화 시 AI 자동 분류 (완료 - 2026-01-19)
- [x] 이용약관 페이지 (완료 - 2026-01-20)
- [x] 개인정보처리방침 페이지 (완료 - 2026-01-20)
- [x] 서비스 소개 페이지 (완료 - 2026-01-20)

### P2 - 중기 (남은 작업)
- [ ] 나라장터 API 연동 (G2B) - 401 오류, API 키 재발급 필요
- [ ] HRD Korea API 연동 (API 키 미설정 - `HRD_AUTH_KEY` 필요)
- [ ] 카카오페이 결제
- [ ] HWP 파일 다운로드/생성

### P2 - 중기 (완료)
- [x] Google 로그인 (완료 - Supabase OAuth)
- [x] 카카오 로그인 (완료 - Supabase OAuth)
- [x] RAG 시맨틱 검색 엔진 (완료 - 2026-01-20)

### P3 - 장기 (남은 작업)
- [ ] 모바일 앱 (React Native/Expo)
- [ ] 공고 알림 푸시 (FCM)
- [ ] 사용자 피드백 수집 기능
- [ ] A/B 테스트 인프라

### P3 - 장기 (완료)
- [x] 관리자 대시보드 통계 차트 (완료 - 2026-01-20)

### Supabase 설정 - 완료
- [x] DB 마이그레이션 실행: `supabase/migrations/003_add_company_approval.sql`
- [x] DB 마이그레이션 실행: `supabase/migrations/004_pgvector_embeddings.sql`
- [x] pgvector 확장 활성화 및 announcement_embeddings 테이블 생성
- [x] Storage 버킷 생성: `business-plans` (비공개)
- [x] Storage RLS 정책 추가
- [x] OAuth URL 설정 수정 (Site URL, Redirect URLs)

### Vercel 환경변수 - 완료 (2026-01-20)
- [x] `UPSTASH_REDIS_REST_TOKEN` - 공백/줄바꿈 제거 완료

---

## 최근 완료 작업 (2026-01-20)

### 비즈니스 모델 변경 (매칭 무료화)
기존 "매칭=유료, 지원서=유료" → 신규 "매칭=무료, 지원서=유료" 모델로 전환:

**변경 사항:**
| 기능 | 이전 | 변경 후 |
|------|------|---------|
| AI 매칭 분석 | Free: 월 3회 / Pro: 무제한 | **모든 사용자 무제한** |
| AI 시맨틱 검색 | 무제한 | 무제한 (유지) |
| AI 지원서 작성 | Free: 불가 / Pro: 무제한 | Free: 불가 / Pro: 무제한 (유지) |

**변경 이유:**
- 사용자가 서비스 가치를 먼저 체험 → 자연스러운 결제 유도
- "매칭률 확인 → 지원서 작성" 전환 퍼널 최적화
- 지원서 작성(시간 절약)이 더 명확한 유료 가치

**수정 파일:**
- `lib/queries/dashboard.ts` - checkUsageLimit 로직 변경
- `app/(dashboard)/dashboard/matching/page.tsx` - 사용량 표시 제거
- `app/(dashboard)/dashboard/matching/matching-form.tsx` - canAnalyze 제한 제거
- `app/(dashboard)/dashboard/billing/page.tsx` - 요금제 설명 업데이트
- `app/page.tsx` - 랜딩 페이지 요금제 업데이트
- `app/(auth)/about/page.tsx` - 서비스 소개 요금제 업데이트

### RAG 시맨틱 검색 엔진
pgvector와 Gemini Embedding을 활용한 AI 시맨틱 공고 검색 기능:

**핵심 기술:**
| 기술 | 설명 |
|------|------|
| pgvector | PostgreSQL 벡터 검색 확장 |
| Gemini text-embedding-004 | 768차원 임베딩 모델 |
| IVFFlat Index | 빠른 근사 벡터 검색 인덱스 |
| Cosine Similarity | 유사도 계산 방식 |

**주요 기능:**
- 자연어 검색: "IT 스타트업 R&D 지원금" 같은 자연어 쿼리 지원
- 유사도 점수: 0-100% 일치도 표시
- 폴백 검색: 시맨틱 검색 실패 시 키워드 검색으로 자동 전환
- 추천 검색어: 사전 정의된 인기 검색어 제공

**데이터베이스:**
```sql
-- announcement_embeddings 테이블
id, announcement_id, embedding (vector[768]), content_hash, updated_at

-- search_announcements_by_embedding RPC 함수
-- 코사인 유사도 기반 시맨틱 검색
```

**벡터화 현황:**
- 총 1,000개 공고 벡터화 완료
- 배치 처리: 10개씩, 1초 딜레이 (Rate Limit 방지)
- 변경 감지: content_hash로 변경된 공고만 재벡터화

수정 파일:
- `supabase/migrations/004_pgvector_embeddings.sql` (신규)
- `app/api/embeddings/generate/route.ts` (신규)
- `app/api/announcements/search/route.ts` (신규)
- `components/announcements/semantic-search.tsx` (신규)
- `components/announcements/announcements-tabs.tsx` (AI 검색 탭 추가)
- `scripts/generate-embeddings.ts` (신규 - 배치 벡터화 스크립트)

### 관리자 대시보드 통계 차트
recharts 라이브러리를 사용한 관리자 대시보드 통계 시각화:

**주요 지표 카드:**
- 전체 사용자 (+ 최근 7일 신규)
- 전체 공고
- AI 매칭 (+ 최근 7일)
- 총 매출 (+ 최근 7일)

**차트:**
| 차트 | 유형 | 설명 |
|------|------|------|
| 사용자 가입 추이 | Area Chart | 최근 7일 가입자 |
| AI 매칭 추이 | Bar Chart | 최근 7일 매칭 |
| 소스별 공고 분포 | Pie Chart | 기업마당, K-Startup 등 |
| 월별 매출 추이 | Bar Chart | 최근 6개월 매출 |

**추가 지표:** 지원서 작성 수, 활성 구독 수, 평균 매칭률

수정 파일:
- `app/admin/page.tsx` (신규)
- `app/admin/admin-dashboard.tsx` (신규)
- `app/api/admin/stats/route.ts` (신규)
- `app/admin/layout.tsx` (사이드바 링크 추가)

### 관리자 페이지 사용자 목록 개선
- 문제: 온보딩 미완료 사용자가 관리자 페이지에 표시되지 않음
- 해결: Supabase Auth Admin API (`auth.admin.listUsers()`) 사용
- 표시 정보: 이메일, 로그인 방식(Google/카카오/이메일), 가입일, 마지막 로그인
- 수정 파일:
  - `app/api/admin/users/route.ts`
  - `app/admin/users/page.tsx`

### 랜딩 페이지 404 링크 수정
- 문제: 서비스 링크(공고 검색, AI 매칭, 지원서 작성) 클릭 시 404
- 해결: 서비스 링크 → 회원가입, 법적 고지 링크 → 실제 페이지 연결
- 수정 파일: `app/page.tsx`

### Vercel 환경변수 수정
- 문제: `UPSTASH_REDIS_REST_TOKEN`에 줄바꿈(`\n`) 포함되어 빌드 경고 발생
- 해결: Vercel CLI로 환경변수 재설정 (줄바꿈 제거)

### 정적 페이지 추가
신규 생성된 페이지:
| 페이지 | URL | 설명 |
|--------|-----|------|
| 이용약관 | `/terms` | 14개 조항 (서비스 정의, 회원의무, 결제/환불, AI 면책 등) |
| 개인정보처리방침 | `/privacy` | 11개 조항 (수집항목, 위탁업체, 보유기간, 이용자권리 등) |
| 서비스 소개 | `/about` | 문제/솔루션, 핵심 기능, 타겟 사용자, 요금제 |

수정 파일:
- `app/(auth)/terms/page.tsx` (신규)
- `app/(auth)/privacy/page.tsx` (신규)
- `app/(auth)/about/page.tsx` (신규)
- `app/page.tsx` (Footer 링크 수정)

### P1 작업 완료 확인
**LLM 응답 스트리밍 (SSE)** - 이미 구현되어 있음:
- `/api/matching/stream` - AI 매칭 스트리밍 API
- `/api/applications/stream` - 지원서 생성 스트리밍 API
- `lib/hooks/use-matching-stream.ts` - 매칭 스트리밍 훅
- `lib/hooks/use-application-stream.ts` - 지원서 스트리밍 훅

**이메일 알림 기능** - 이미 구현되어 있음:
- DB 테이블: `notification_preferences`, `notification_logs`, `saved_announcements`
- API: `/api/notifications/send` (Cron job), `/api/notifications/settings`
- UI: `components/notifications/notification-settings.tsx` (설정 페이지에 통합)
- 공고 저장: 공고 상세 페이지에 "관심 등록" 버튼 구현
- Cron job: 매일 00:00 UTC (09:00 KST) 마감 알림 발송
- Resend: 이메일 발송 서비스 연동

---

## 완료 작업 (2026-01-19)

### 동기화 시 AI 자동 분류 기능
- 공고 동기화 완료 후 Gemini AI가 자동으로 지원자격 파싱
- 각 동기화 API(smes, bizinfo, kstartup)에서 최신 10개 공고 자동 분류
- 파싱 내용: 기업유형, 직원수, 매출, 업력, 업종, 지역, 필요 인증 등
- Cron 추가: `parse-eligibility` (05:30, 17:30 UTC) - 미파싱 공고 추가 처리
- vercel.json: 동기화 API maxDuration 60초 → 120초 증가
- 기존 550건 공고 AI 파싱 완료

수정 파일:
- `app/api/announcements/smes/sync/route.ts`
- `app/api/announcements/bizinfo/sync/route.ts`
- `app/api/announcements/kstartup/sync/route.ts`
- `vercel.json`

### 소스별 탭 내부 상세 페이지 연동
- 기존: 각 소스별 탭에서 외부 API 직접 호출 → 외부 링크로 이동
- 변경: Supabase에서 데이터 조회 → 내부 상세 페이지(`/dashboard/announcements/[id]`)로 이동
- 수정 파일:
  - `components/announcements/smes-announcement-list.tsx`
  - `components/announcements/bizinfo-announcement-list.tsx`
  - `components/announcements/kstartup-announcement-list.tsx`
  - `components/announcements/g2b-announcement-list.tsx`
  - `components/announcements/hrd-announcement-list.tsx`

### 미등록 사업자 승인 프로세스
- 온보딩 페이지에서 사업자등록 여부 선택 가능
- 미등록 사업자는 사업계획서(PDF) 업로드 필수
- 제출 후 승인 대기 페이지(`/dashboard/pending-approval`)로 이동
- 관리자 승인 페이지(`/admin/approvals`)에서 승인/거절 처리
- 비공개 Storage 버킷 사용 (서명된 URL로 파일 접근)

### Vercel 프로젝트 연결 수정
- 기존 `govhelper-main` 프로젝트에서 `govhelper` 프로젝트로 재연결
- `govhelpers.com` 도메인에 올바르게 배포되도록 수정

### Google/카카오 OAuth 설정 수정
- 문제: OAuth 로그인 후 `localhost:3000`으로 리다이렉트됨
- 원인: Supabase Site URL이 localhost로 설정되어 있었음
- 해결: Supabase Dashboard > Authentication > URL Configuration 수정
  - Site URL: `https://govhelpers.com`
  - Redirect URLs: `https://govhelpers.com/auth/callback` 추가

---

## Supabase 필수 설정

### Authentication > URL Configuration
| 설정 | 값 |
|------|-----|
| Site URL | `https://govhelpers.com` |
| Redirect URLs | `https://govhelpers.com/auth/callback` |

### Authentication > Providers
| Provider | 필요 설정 |
|----------|----------|
| Google | Client ID, Client Secret (Google Cloud Console) |
| Kakao | REST API Key, Client Secret (Kakao Developers) |

---

## 참고 링크

- [토스 UX 라이팅 가이드](https://toss.im/career/article/toss-product-language)
- [Supabase 문서](https://supabase.com/docs)
- [Vercel 문서](https://vercel.com/docs)
- [Shadcn UI](https://ui.shadcn.com/)
